"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { NoteGrid } from "@/components/NoteGrid";
import type { ContentType, Category, Tag } from "@/types/note";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<ContentType | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeType) params.set("content_type", activeType);
    if (activeTag) params.set("tag", activeTag);
    if (activeCategory) params.set("category_id", activeCategory);

    const res = await fetch(`/api/notes?${params}`);
    const data = await res.json();
    setNotes(data.notes ?? []);
    setLoading(false);
  }, [user, search, activeType, activeTag, activeCategory]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    Promise.all([
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("name"),
      supabase
        .from("tags")
        .select("*")
        .order("usage_count", { ascending: false })
        .limit(10),
    ]).then(([catRes, tagRes]) => {
      setCategories(catRes.data ?? []);
      setPopularTags(tagRes.data ?? []);
    });
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300);
    return () => clearTimeout(timer);
  }, [fetchNotes]);

  // Compute type counts from notes
  useEffect(() => {
    const c: Record<string, number> = {};
    for (const n of notes) {
      c[n.content_type] = (c[n.content_type] ?? 0) + 1;
    }
    setCounts(c);
  }, [notes]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Nacitam...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header search={search} onSearchChange={setSearch} />
      <div className="flex flex-1">
        <Sidebar
          counts={counts}
          categories={categories}
          popularTags={popularTags}
          activeType={activeType}
          activeCategory={activeCategory}
          activeTag={activeTag}
          onTypeChange={setActiveType}
          onCategoryChange={setActiveCategory}
          onTagChange={setActiveTag}
        />
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              Nacitam poznamky...
            </div>
          ) : (
            <NoteGrid notes={notes} />
          )}
        </main>
      </div>
    </div>
  );
}
