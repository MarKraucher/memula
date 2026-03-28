"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContentType } from "@/types/note";

interface NoteDetailProps {
  note: {
    id: string;
    title: string;
    summary: string | null;
    content_type: ContentType;
    source_url: string | null;
    raw_content: string | null;
    structured_data: Record<string, unknown>;
    status: string;
    language: string;
    created_at: string;
    updated_at: string;
    note_tags: Array<{ tags: { id: string; name: string } }>;
    note_categories: Array<{
      categories: { id: string; name: string; icon: string | null };
    }>;
  };
}

export function NoteDetail({ note }: NoteDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Opravdu chcete smazat tuto poznamku?")) return;
    setDeleting(true);

    const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    } else {
      setDeleting(false);
      alert("Smazani se nezdarilo.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(note.created_at).toLocaleDateString("cs-CZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/notes/${note.id}/edit`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Upravit
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Mazu..." : "Smazat"}
          </button>
        </div>
      </div>

      {/* Categories & Tags */}
      <div className="flex flex-wrap gap-2">
        {note.note_categories.map((nc) => (
          <span
            key={nc.categories.id}
            className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand"
          >
            {nc.categories.icon} {nc.categories.name}
          </span>
        ))}
        {note.note_tags.map((nt) => (
          <span
            key={nt.tags.id}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
          >
            #{nt.tags.name}
          </span>
        ))}
      </div>

      {/* Source URL */}
      {note.source_url && (
        <a
          href={note.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-brand hover:underline"
        >
          {note.source_url}
        </a>
      )}

      {/* Summary */}
      {note.summary && (
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-500">Souhrn</p>
          <p className="mt-1 text-gray-700">{note.summary}</p>
        </div>
      )}

      {/* Content */}
      {note.raw_content && (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{note.raw_content}</p>
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Zpet na prehled
      </button>
    </div>
  );
}
