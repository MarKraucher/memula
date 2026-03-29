import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { updateNoteSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, is_ai_suggested, tags(id, name)),
      note_categories(category_id, is_ai_suggested, categories(id, name, icon)),
      note_images(id, storage_path, is_primary)
    `)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tags, category_ids, ...noteData } = parsed.data;
  const supabase = await createClient();

  // Update note fields
  if (Object.keys(noteData).length > 0) {
    const { error } = await (supabase
      .from("notes") as any)
      .update(noteData)
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Replace tags if provided
  if (tags !== undefined) {
    await supabase.from("note_tags").delete().eq("note_id", id);

    for (const tagName of tags) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName.toLowerCase() }, { onConflict: "name" })
        .select("id")
        .single();

      if (tag) {
        await supabase.from("note_tags").insert({
          note_id: id,
          tag_id: tag.id,
        });
      }
    }
  }

  // Replace categories if provided
  if (category_ids !== undefined) {
    await supabase.from("note_categories").delete().eq("note_id", id);

    if (category_ids.length > 0) {
      await supabase.from("note_categories").insert(
        category_ids.map((cid) => ({
          note_id: id,
          category_id: cid,
        }))
      );
    }
  }

  // Return updated note
  const { data } = await supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(id, name)),
      note_categories(category_id, categories(id, name, icon))
    `)
    .eq("id", id)
    .single();

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
