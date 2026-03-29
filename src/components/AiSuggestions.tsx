"use client";

import { useState } from "react";

interface AiSuggestionsProps {
  noteId: string;
  suggestedTags: { id: string; name: string; is_ai_suggested: boolean }[];
  suggestedCategories: {
    id: string;
    name: string;
    icon: string | null;
    is_ai_suggested: boolean;
  }[];
  onUpdate: () => void;
}

export function AiSuggestions({
  noteId,
  suggestedTags,
  suggestedCategories,
  onUpdate,
}: AiSuggestionsProps) {
  const aiTags = suggestedTags.filter((t) => t.is_ai_suggested);
  const aiCategories = suggestedCategories.filter((c) => c.is_ai_suggested);

  const [removedTags, setRemovedTags] = useState<Set<string>>(new Set());
  const [removedCategories, setRemovedCategories] = useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);

  if (aiTags.length === 0 && aiCategories.length === 0) return null;

  function toggleTag(id: string) {
    setRemovedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(id: string) {
    setRemovedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);

    const keepTags = suggestedTags
      .filter((t) => !removedTags.has(t.id))
      .map((t) => t.name);
    const keepCategories = suggestedCategories
      .filter((c) => !removedCategories.has(c.id))
      .map((c) => c.id);

    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: keepTags,
        category_ids: keepCategories,
      }),
    });

    setSaving(false);
    onUpdate();
  }

  return (
    <div className="rounded-lg border border-brand/30 bg-brand/5 p-4">
      <p className="text-sm font-medium text-brand">AI navrhy</p>

      {aiTags.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500">Navrhovane stitky:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {aiTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                  removedTags.has(tag.id)
                    ? "bg-gray-100 text-gray-400 line-through"
                    : "bg-brand/10 text-brand"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {aiCategories.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500">Navrhovane kategorie:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {aiCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                  removedCategories.has(cat.id)
                    ? "bg-gray-100 text-gray-400 line-through"
                    : "bg-brand/10 text-brand"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-lg bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {saving ? "Ukladam..." : "Potvrdit navrhy"}
      </button>
    </div>
  );
}
