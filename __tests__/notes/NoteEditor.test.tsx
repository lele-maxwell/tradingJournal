import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import NoteEditor from "@/components/notes/NoteEditor";

const user = { id: "u_1" };
vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(async () => user),
}));

let updateCalls = 0;
let lastUpdate: FormData | null = null;
vi.mock("@/lib/actions/note.actions", () => ({
  createNoteAction: vi.fn(async () => {
    throw new Error("NEXT_REDIRECT:/notes/n_1");
  }),
  updateNoteAction: vi.fn(async (_prev: unknown, fd: FormData) => {
    updateCalls += 1;
    lastUpdate = fd;
    return {};
  }),
  deleteNoteAction: vi.fn(async () => undefined),
}));

beforeEach(() => {
  updateCalls = 0;
  lastUpdate = null;
  vi.useRealTimers();
});

describe("NoteEditor (create mode)", () => {
  it("renders a Create button and empty inputs", () => {
    render(<NoteEditor mode="create" />);
    expect(screen.getByTestId("save-button")).toHaveTextContent(/Create note/i);
    expect(screen.getByLabelText(/Note title/i)).toBeInTheDocument();
    expect(screen.getByTestId("note-content")).toBeInTheDocument();
  });

  it("updates title and content as the user types", () => {
    render(<NoteEditor mode="create" />);
    const title = screen.getByLabelText(/Note title/i) as HTMLInputElement;
    const content = screen.getByTestId("note-content") as HTMLTextAreaElement;
    fireEvent.change(title, { target: { value: "My note" } });
    fireEvent.change(content, { target: { value: "hello" } });
    expect(title.value).toBe("My note");
    expect(content.value).toBe("hello");
  });
});

describe("NoteEditor (edit mode)", () => {
  const initial = {
    id: "n_42",
    title: "Old",
    content: "Old body",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  it("renders the existing title and content", () => {
    render(<NoteEditor mode="edit" initial={initial} />);
    expect((screen.getByLabelText(/Note title/i) as HTMLInputElement).value).toBe("Old");
    expect((screen.getByTestId("note-content") as HTMLTextAreaElement).value).toBe("Old body");
  });

  it("toggles between edit / preview / split views", () => {
    render(<NoteEditor mode="edit" initial={initial} />);
    expect(screen.getByTestId("note-content")).toBeInTheDocument();
    expect(screen.getByTestId("note-preview")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("view-mode-edit"));
    expect(screen.queryByTestId("note-preview")).not.toBeInTheDocument();
    expect(screen.getByTestId("note-content")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("view-mode-preview"));
    expect(screen.queryByTestId("note-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("note-preview")).toBeInTheDocument();
  });

  it("triggers a debounced autosave on edit", async () => {
    vi.useFakeTimers();
    render(<NoteEditor mode="edit" initial={initial} />);
    const title = screen.getByLabelText(/Note title/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "New" } });
    expect(updateCalls).toBe(0);
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(updateCalls).toBeGreaterThanOrEqual(1);
    expect(lastUpdate?.get("title")).toBe("New");
  });
});
