import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const search = request.nextUrl.searchParams.get("q") ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("tags")
    .select("id, name, usage_count")
    .order("usage_count", { ascending: false })
    .limit(20);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
