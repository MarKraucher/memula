"use client";

import type { ContentType, Category, Tag } from "@/types/note";

interface SidebarProps {
  counts: Record<string, number>;
  categories: Category[];
  popularTags: Tag[];
  activeType: ContentType | null;
  activeCategory: string | null;
  activeTag: string | null;
  onTypeChange: (type: ContentType | null) => void;
  onCategoryChange: (id: string | null) => void;
  onTagChange: (name: string | null) => void;
}

const typeConfig: { type: ContentType | null; label: string; icon: string }[] = [
  { type: null, label: "Vsechny", icon: "" },
  { type: "link", label: "Odkazy", icon: "" },
  { type: "text", label: "Poznamky", icon: "" },
  { type: "video", label: "Videa", icon: "" },
  { type: "image", label: "Obrazky", icon: "" },
  { type: "recipe", label: "Recepty", icon: "" },
];

export function Sidebar({
  counts,
  categories,
  popularTags,
  activeType,
  activeCategory,
  activeTag,
  onTypeChange,
  onCategoryChange,
  onTagChange,
}: SidebarProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <aside className="hidden w-52 shrink-0 space-y-6 border-r border-gray-200 bg-white p-4 md:block">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Typy
        </p>
        {typeConfig.map(({ type, label }) => {
          const count = type ? (counts[type] ?? 0) : totalCount;
          const isActive = activeType === type;
          return (
            <button
              key={label}
              onClick={() => onTypeChange(type)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                isActive
                  ? "bg-brand text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{label}</span>
              <span className={isActive ? "opacity-70" : "text-gray-400"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {categories.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Kategorie
          </p>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                onCategoryChange(activeCategory === cat.id ? null : cat.id)
              }
              className={`flex w-full items-center rounded-lg px-2 py-1.5 text-sm ${
                activeCategory === cat.id
                  ? "bg-brand text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {popularTags.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Oblibene tagy
          </p>
          <div className="flex flex-wrap gap-1.5">
            {popularTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() =>
                  onTagChange(activeTag === tag.name ? null : tag.name)
                }
                className={`rounded-full px-2.5 py-0.5 text-xs ${
                  activeTag === tag.name
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
