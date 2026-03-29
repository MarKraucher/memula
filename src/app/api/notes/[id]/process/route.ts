import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { classifyContent } from "@/lib/ai/classify";
import { generateEmbedding } from "@/lib/ai/embed";
import { fetchUrlContent } from "@/lib/ai/fetch-content";
import { checkAndIncrementUsage } from "@/lib/usage";

const MAX_PROCESSING_ATTEMPTS = 3;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = await createClient();

  // Fetch the note
  const { data: note, error: fetchError } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (fetchError || !note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (note.status === "ready") {
    return NextResponse.json({ message: "Already processed" });
  }

  if (note.processing_attempts >= MAX_PROCESSING_ATTEMPTS) {
    await supabase
      .from("notes")
      .update({ status: "error" })
      .eq("id", id);
    return NextResponse.json(
      { error: "Max processing attempts reached" },
      { status: 422 }
    );
  }

  // Check freemium limits BEFORE calling OpenAI
  const usage = await checkAndIncrementUsage(auth.user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: "Mesicni limit AI zpracovani vycerpan",
        count: usage.count,
        limit: usage.limit,
      },
      { status: 429 }
    );
  }

  // Mark as processing
  await supabase
    .from("notes")
    .update({
      status: "processing",
      processing_attempts: note.processing_attempts + 1,
    })
    .eq("id", id);

  try {
    // Fetch URL content if applicable
    let fetchedHtml: string | null = null;
    if (note.source_url) {
      try {
        fetchedHtml = await fetchUrlContent(note.source_url);
      } catch {
        // URL fetch failed — continue with what we have
      }
    }

    // Classify content with GPT-4o
    const classification = await classifyContent({
      title: note.title,
      rawContent: note.raw_content,
      sourceUrl: note.source_url,
      fetchedHtml,
    });

    // Generate embedding
    const embedding = await generateEmbedding({
      title: classification.title,
      summary: classification.summary,
      content: note.raw_content,
    });

    // Update note with AI results
    await supabase
      .from("notes")
      .update({
        title: classification.title,
        summary: classification.summary,
        content_type: classification.content_type,
        structured_data: classification.structured_data,
        language: classification.language,
        embedding: JSON.stringify(embedding),
        status: "ready",
      })
      .eq("id", id);

    // Add AI-suggested tags
    for (const tagName of classification.suggested_tags) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName.toLowerCase() }, { onConflict: "name" })
        .select("id")
        .single();

      if (tag) {
        await supabase
          .from("note_tags")
          .upsert(
            { note_id: id, tag_id: tag.id, is_ai_suggested: true },
            { onConflict: "note_id,tag_id" }
          );
      }
    }

    // Add AI-suggested categories
    for (const catName of classification.suggested_categories) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("name", catName)
        .is("user_id", null)
        .single();

      if (category) {
        await supabase
          .from("note_categories")
          .upsert(
            { note_id: id, category_id: category.id, is_ai_suggested: true },
            { onConflict: "note_id,category_id" }
          );
      }
    }

    return NextResponse.json({
      status: "ready",
      classification,
    });
  } catch (error) {
    const newAttempts = note.processing_attempts + 1;
    const newStatus = newAttempts >= MAX_PROCESSING_ATTEMPTS ? "error" : "pending";

    await supabase
      .from("notes")
      .update({ status: newStatus })
      .eq("id", id);

    return NextResponse.json(
      { error: "Processing failed", details: String(error) },
      { status: 500 }
    );
  }
}
