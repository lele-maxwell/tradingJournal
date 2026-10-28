import type { Metadata } from "next";
import NoteEditor from "@/components/notes/NoteEditor";

export const metadata: Metadata = {
  title: "New Note",
  description: "Create a new markdown note in MaxStrat",
};

export default function NewNotePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          New Note
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Capture an idea, a strategy, or a lesson. Markdown supported.
        </p>
      </div>
      <NoteEditor mode="create" />
    </div>
  );
}
