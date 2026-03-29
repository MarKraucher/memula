"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NoteDetail } from "@/components/NoteDetail";

export default function NoteDetailPage() {
  const params = useParams();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/notes/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setNote(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
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

  if (error || !note) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Poznamka nebyla nalezena.
      </div>
    );
  }

  function refetchNote() {
    fetch(`/api/notes/${params.id}`)
      .then((r) => r.json())
      .then((data) => setNote(data));
  }

  return <NoteDetail note={note} onUpdate={refetchNote} />;
}
