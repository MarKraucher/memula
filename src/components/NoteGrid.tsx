import { NoteCard } from "./NoteCard";

interface NoteGridProps {
  notes: Array<{
    id: string;
    title: string;
    summary: string | null;
    content_type: "link" | "text" | "video" | "image" | "recipe";
    status: "pending" | "processing" | "ready" | "error";
    source_url: string | null;
    created_at: string;
    note_tags: Array<{ tags: { name: string } }>;
  }>;
}

export function NoteGrid({ notes }: NoteGridProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="mt-3 text-sm">Zatim zadne poznamky</p>
        <a
          href="/notes/new"
          className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Pridat prvni poznamku
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          id={note.id}
          title={note.title}
          summary={note.summary}
          content_type={note.content_type}
          status={note.status}
          source_url={note.source_url}
          created_at={note.created_at}
          tags={note.note_tags.map((nt) => nt.tags)}
        />
      ))}
    </div>
  );
}
