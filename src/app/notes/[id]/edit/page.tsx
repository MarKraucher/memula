"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NoteForm } from "@/components/NoteForm";

export default function EditNotePage() {
  const params = useParams();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/notes/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setInitialData({
          title: data.title,
          summary: data.summary,
          content_type: data.content_type,
          source_url: data.source_url,
          raw_content: data.raw_content,
          tags: data.note_tags?.map((nt: any) => nt.tags.name) ?? [],
          category_ids:
            data.note_categories?.map((nc: any) => nc.categories.id) ?? [],
        });
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Nacitam...
      </div>
    );
  }

  return (
    <NoteForm noteId={params.id as string} initialData={initialData} />
  );
}
