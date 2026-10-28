import Link from "next/link";
import { listNotes, type NoteSort } from "@/lib/actions/note.actions";
import { noteExcerpt } from "@/lib/validations/note.schema";
import NoteListItem from "@/components/notes/NoteListItem";

export const dynamic = "force-dynamic";

function isNoteSort(value: string | undefined): value is NoteSort {
  return value === "updated" || value === "created" || value === "alpha";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const rawSort = params.sort;
  const sort: NoteSort = isNoteSort(rawSort) ? rawSort : "updated";

  const notes = await listNotes({ q, sort });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
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
            Notes
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Your personal knowledge workspace.{" "}
            {notes.length > 0
              ? `${notes.length} note${notes.length !== 1 ? "s" : ""}.`
              : ""}
          </p>
        </div>
        <Link href="/notes/new" className="btn btn-primary">
          + New Note
        </Link>
      </div>

      <form
        style={{
          display: "flex",
          gap: 10,
          padding: "14px 16px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          flexWrap: "wrap",
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title or content…"
          className="input"
          style={{ width: 260 }}
        />
        <select name="sort" defaultValue={sort} className="input" style={{ width: 180 }}>
          <option value="updated">Recently updated</option>
          <option value="created">Recently created</option>
          <option value="alpha">Alphabetical (A–Z)</option>
        </select>
        <button type="submit" className="btn btn-secondary">
          Apply
        </button>
        {(q || sort !== "updated") && (
          <Link href="/notes" className="btn btn-ghost">
            Clear
          </Link>
        )}
      </form>

      {notes.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          {q
            ? "No notes match your search."
            : "No notes yet. "}
          {!q && (
            <Link
              href="/notes/new"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Create your first note →
            </Link>
          )}
        </div>
      ) : (
        <ul
          data-testid="notes-list"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {notes.map((n) => (
            <NoteListItem
              key={n.id}
              href={`/notes/${n.id}`}
              title={n.title}
              excerpt={noteExcerpt(n.content)}
              createdAt={formatDate(n.createdAt)}
              updatedAt={formatDate(n.updatedAt)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
