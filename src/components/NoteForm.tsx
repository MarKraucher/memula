"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/note";

interface NoteFormProps {
  noteId?: string;
  initialData?: {
    title: string;
    summary: string | null;
    content_type: string;
    source_url: string | null;
    raw_content: string | null;
    tags: string[];
    category_ids: string[];
  };
}

const contentTypes = [
  { value: "text", label: "Poznamka" },
  { value: "link", label: "Odkaz" },
  { value: "video", label: "Video" },
  { value: "image", label: "Obrazek" },
  { value: "recipe", label: "Recept" },
];

export function NoteForm({ noteId, initialData }: NoteFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [contentType, setContentType] = useState(initialData?.content_type ?? "text");
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url ?? "");
  const [rawContent, setRawContent] = useState(initialData?.raw_content ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [categoryIds, setCategoryIds] = useState<string[]>(initialData?.category_ids ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      title,
      content_type: contentType,
      source_url: sourceUrl || null,
      raw_content: rawContent || null,
      tags,
      category_ids: categoryIds,
    };

    const url = noteId ? `/api/notes/${noteId}` : "/api/notes";
    const method = noteId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/notes/${data.id ?? noteId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Ulozeni se nezdarilo.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-xl font-bold text-gray-900">
        {noteId ? "Upravit poznamku" : "Nova poznamka"}
      </h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Content type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Typ</label>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => setContentType(ct.value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                contentType === ct.value
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nazev</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {/* URL (for link/video) */}
      {(contentType === "link" || contentType === "video") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">URL</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      {/* Content (for text/recipe) */}
      {(contentType === "text" || contentType === "recipe") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Obsah</label>
          <textarea
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            rows={8}
            maxLength={50000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Stitky</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Pridejte stitek..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            Pridat
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-brand/60 hover:text-brand"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kategorie</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                categoryIds.includes(cat.id)
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Ukladam..." : noteId ? "Ulozit zmeny" : "Vytvorit poznamku"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Zrusit
        </button>
      </div>
    </form>
  );
}
