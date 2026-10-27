"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  type NoteActionState,
} from "@/lib/actions/note.actions";
import NotePreview from "@/components/notes/NotePreview";

type ViewMode = "edit" | "preview" | "split";

type EditorInitial = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const AUTOSAVE_DELAY_MS = 1200;

const initialState: NoteActionState = {};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type SaveData = { state: SaveState; lastSavedAt: string | null };

type SaveAction =
  | { type: "edit" }
  | { type: "begin-save" }
  | { type: "save-result"; ok: boolean }
  | { type: "reset"; snapshot: { title: string; content: string } };

function saveReducer(data: SaveData, action: SaveAction): SaveData {
  switch (action.type) {
    case "edit":
      return { state: data.state === "error" ? "error" : "dirty", lastSavedAt: data.lastSavedAt };
    case "begin-save":
      return { state: "saving", lastSavedAt: data.lastSavedAt };
    case "save-result":
      return {
        state: action.ok ? "saved" : "error",
        lastSavedAt: action.ok ? new Date().toISOString() : data.lastSavedAt,
      };
    case "reset":
      return { state: "idle", lastSavedAt: data.lastSavedAt };
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  if (diff < 5_000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function saveStateLabel(state: SaveState): string {
  switch (state) {
    case "idle":
      return "Idle";
    case "dirty":
      return "Unsaved changes";
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
  }
}

function saveStateColor(state: SaveState): string {
  switch (state) {
    case "idle":
      return "var(--text-muted)";
    case "dirty":
      return "var(--warning)";
    case "saving":
      return "var(--text-muted)";
    case "saved":
      return "var(--success)";
    case "error":
      return "var(--danger)";
  }
}

export default function NoteEditor({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: EditorInitial;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [saveData, dispatchSave] = useReducer(saveReducer, {
    state: "idle",
    lastSavedAt: initial?.updatedAt ?? null,
  });
  const { state: saveState, lastSavedAt } = saveData;

  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const action = mode === "create" ? createNoteAction : updateNoteAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const fe = state.fieldErrors ?? {};
  const formError = state.error;

  // Snapshot of the last successfully saved title/content. Used to decide
  // whether the current state is "dirty" relative to what's on the server.
  const lastSavedSnapshot = useRef({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
  });

  // Stable handler so the effect below doesn't re-run when the user toggles
  // view modes.
  const triggerAutosave = useCallback(() => {
    if (mode !== "edit") return;
    if (!formRef.current) return;
    dispatchSave({ type: "begin-save" });
    formRef.current.requestSubmit();
  }, [mode]);

  // Mark dirty / schedule autosave whenever title or content diverges from
  // the last saved snapshot.
  useEffect(() => {
    if (mode !== "edit") return;
    if (
      title === lastSavedSnapshot.current.title &&
      content === lastSavedSnapshot.current.content
    ) {
      return;
    }
    dispatchSave({ type: "edit" });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(triggerAutosave, AUTOSAVE_DELAY_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, content, mode, triggerAutosave]);

  // When the server action settles (pending flips false), apply the result.
  // We track the previous pending value to detect the false→true/false edge.
  const prevPendingRef = useRef(false);
  useEffect(() => {
    const wasPending = prevPendingRef.current;
    prevPendingRef.current = pending;
    if (mode !== "edit") return;
    if (!wasPending || pending) return;
    // Edge: pending → !pending
    if (state.error) {
      dispatchSave({ type: "save-result", ok: false });
    } else {
      lastSavedSnapshot.current = { title, content };
      dispatchSave({ type: "save-result", ok: true });
    }
    // We only want to react to pending→settled transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // Flush a pending autosave on unmount (best-effort; browsers may cancel).
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleDelete = (form: HTMLFormElement) => {
    if (!window.confirm("Delete this note? This cannot be undone.")) {
      return;
    }
    form.requestSubmit();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <form
        ref={formRef}
        action={formAction}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
        data-testid="note-form"
      >
        {mode === "edit" && initial ? (
          <input type="hidden" name="id" value={initial.id} />
        ) : null}

        {/* Title row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled note"
            className={`input ${fe.title ? "input-error" : ""}`}
            style={{
              flex: 1,
              minWidth: 220,
              fontSize: 18,
              fontWeight: 600,
              padding: "12px 14px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
            maxLength={200}
            aria-label="Note title"
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
              minWidth: 200,
            }}
          >
            <span
              data-testid="save-status"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: saveStateColor(saveState),
              }}
            >
              {mode === "edit"
                ? `${saveStateLabel(saveState)}${
                    saveState === "saved" && lastSavedAt
                      ? ` · ${formatRelative(lastSavedAt)}`
                      : ""
                  }`
                : "Draft"}
            </span>
            {mode === "edit" && initial ? (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Created{" "}
                {new Date(initial.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            ) : null}
          </div>
        </div>

        {fe.title?.[0] ? <p className="error-msg">{fe.title[0]}</p> : null}
        {formError ? (
          <p
            className="error-msg"
            style={{
              padding: "8px 12px",
              background: "var(--danger-muted)",
              borderRadius: 6,
            }}
          >
            {formError}
          </p>
        ) : null}

        {/* View mode toggle */}
        <div
          role="tablist"
          aria-label="Editor view mode"
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 4,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: "fit-content",
          }}
        >
          {(["edit", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={viewMode === m}
              data-testid={`view-mode-${m}`}
              onClick={() => setViewMode(m)}
              className="btn btn-sm"
              style={{
                background: viewMode === m ? "var(--bg-hover)" : "transparent",
                color:
                  viewMode === m
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                textTransform: "capitalize",
              }}
            >
              {m === "edit" ? "Edit" : m === "split" ? "Split" : "Preview"}
            </button>
          ))}
        </div>

        {/* Editor + preview */}
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns:
              viewMode === "split" ? "1fr 1fr" : "1fr",
          }}
          className="note-editor-grid"
        >
          {viewMode !== "preview" ? (
            <textarea
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                "Write markdown here…\n\n# Heading\n**Bold**, *italic*, `code`\n\n- [ ] Checklist\n- [x] Done\n\n| col | col |\n|-----|-----|\n| a   | b   |"
              }
              className={`input ${fe.content ? "input-error" : ""}`}
              style={{
                minHeight: 480,
                resize: "vertical",
                fontFamily: "var(--font-mono)",
                fontSize: 13.5,
                lineHeight: 1.6,
                padding: 16,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                whiteSpace: "pre-wrap",
              }}
              spellCheck
              aria-label="Note content"
              data-testid="note-content"
            />
          ) : null}
          {viewMode !== "edit" ? (
            <div
              style={{
                minHeight: 480,
                padding: 16,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                overflow: "auto",
              }}
            >
              <NotePreview content={content} />
            </div>
          ) : null}
        </div>

        {fe.content?.[0] ? <p className="error-msg">{fe.content[0]}</p> : null}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending && mode === "create"}
              data-testid="save-button"
            >
              {mode === "create" ? "Create note" : "Save now"}
            </button>
            {mode === "create" ? (
              <Link href="/notes" className="btn btn-ghost">
                Cancel
              </Link>
            ) : null}
          </div>
        </div>
      </form>

      {mode === "edit" && initial ? (
        <form
          action={deleteNoteAction}
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete(e.currentTarget);
          }}
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <input type="hidden" name="id" value={initial.id} />
          <button
            type="submit"
            className="btn btn-danger btn-sm"
            data-testid="delete-button"
          >
            Delete
          </button>
        </form>
      ) : null}
    </div>
  );
}
