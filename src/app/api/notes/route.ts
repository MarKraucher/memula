import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { createNoteSchema, noteQuerySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = noteQuerySchema.safeParse(params);

  if (!query.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { search, content_type, sort, limit, offset } = query.data;
  const supabase = await createClient();

  let q = supabase
    .from("notes")
    .select(`
      *,
      note_tags(tag_id, tags(id, name)),
      note_categories(category_id, categories(id, name, icon))
    `)
    .eq("user_id", auth.user.id);

  if (content_type) q = q.eq("content_type", content_type);
  if (search) q = q.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);

  switch (sort) {
    case "oldest":
      q = q.order("created_at", { ascending: true });
      break;
    case "alphabetical":
      q = q.order("title", { ascending: true });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data, count });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tags, category_ids, ...noteData } = parsed.data;
  const supabase = await createClient();

  // Create the note
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .insert({
      ...noteData,
      user_id: auth.user.id,
      status: "pending",
    })
    .select()
    .single();

  if (noteError) {
    return NextResponse.json({ error: noteError.message }, { status: 500 });
  }

  // Handle tags
  if (tags.length > 0) {
    for (const tagName of tags) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ name: tagName.toLowerCase() }, { onConflict: "name" })
        .select("id")
        .single();

      if (tag) {
        await supabase.from("note_tags").insert({
          note_id: note.id,
          tag_id: tag.id,
        });
      }
    }
  }

  // Handle categories
  if (category_ids.length > 0) {
    await supabase.from("note_categories").insert(
      category_ids.map((cid) => ({
        note_id: note.id,
        category_id: cid,
      }))
    );
  }

  return NextResponse.json(note, { status: 201 });
}
