import type { ContentType, NoteStatus } from "@/types/note";

interface NoteCardProps {
  id: string;
  title: string;
  summary: string | null;
  content_type: ContentType;
  status: NoteStatus;
  tags: { name: string }[];
  created_at: string;
  source_url: string | null;
}

const typeLabels: Record<ContentType, { label: string; color: string }> = {
  link: { label: "odkaz", color: "bg-blue-100 text-blue-800" },
  text: { label: "poznamka", color: "bg-green-100 text-green-800" },
  video: { label: "video", color: "bg-red-100 text-red-800" },
  image: { label: "obrazek", color: "bg-purple-100 text-purple-800" },
  recipe: { label: "recept", color: "bg-yellow-100 text-yellow-800" },
};

export function NoteCard({
  id,
  title,
  summary,
  content_type,
  status,
  tags,
  created_at,
}: NoteCardProps) {
  const type = typeLabels[content_type];
  const isProcessing = status === "pending" || status === "processing";
  const isError = status === "error";

  const relativeDate = new Date(created_at).toLocaleDateString("cs-CZ");

  return (
    <a
      href={`/notes/${id}`}
      className={`block rounded-lg border bg-white transition-shadow hover:shadow-md ${
        isProcessing
          ? "border-yellow-300"
          : isError
          ? "border-red-300"
          : "border-gray-200"
      }`}
    >
      <div
        className={`flex h-24 items-center justify-center rounded-t-lg ${
          isProcessing
            ? "bg-yellow-50"
            : isError
            ? "bg-red-50"
            : "bg-gray-50"
        }`}
      >
        {isProcessing ? (
          <div className="text-center">
            <div className="text-xs text-yellow-700">Zpracovava se...</div>
          </div>
        ) : isError ? (
          <div className="text-center">
            <div className="text-xs text-red-700">Chyba zpracovani</div>
          </div>
        ) : (
          <div className="text-3xl text-gray-300">{content_type[0].toUpperCase()}</div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
          {title}
        </h3>
        {summary && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{summary}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${type.color}`}
            >
              {type.label}
            </span>
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag.name}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
              >
                #{tag.name}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">{relativeDate}</span>
        </div>
      </div>
    </a>
  );
}
