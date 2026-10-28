import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNote } from "@/lib/actions/note.actions";
import NoteEditor from "@/components/notes/NoteEditor";

export const metadata: Metadata = { title: "Edit Note" };

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <NoteEditor
        mode="edit"
        initial={{
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
