import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const listMock = vi.fn();
const getNoteMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(async () => ({ id: "u_1" })),
}));

vi.mock("@/lib/actions/note.actions", () => ({
  listNotes: (opts: unknown) => listMock(opts),
  getNote: (id: string) => getNoteMock(id),
}));

beforeEach(() => {
  listMock.mockReset();
  getNoteMock.mockReset();
});

describe("NotesPage", () => {
  it("shows the empty state when there are no notes", async () => {
    listMock.mockResolvedValueOnce([]);
    const NotesPage = (await import("@/app/(dashboard)/notes/page.tsx")).default;
    const element = await NotesPage({
      searchParams: Promise.resolve({ q: "", sort: "updated" }),
    });
    render(<>{element}</>);
    expect(screen.getByText(/No notes yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Create your first note/i)).toBeInTheDocument();
  });

  it("shows a 'No notes match your search' when q yields nothing", async () => {
    listMock.mockResolvedValueOnce([]);
    const NotesPage = (await import("@/app/(dashboard)/notes/page.tsx")).default;
    const element = await NotesPage({
      searchParams: Promise.resolve({ q: "missing", sort: "updated" }),
    });
    render(<>{element}</>);
    expect(screen.getByText(/No notes match your search/i)).toBeInTheDocument();
  });

  it("renders one row per note with title, updated, created", async () => {
    listMock.mockResolvedValueOnce([
      {
        id: "n1",
        title: "ICT Concepts",
        content: "## ICT\n\n- order blocks\n- FVGs",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-05T00:00:00Z"),
      },
      {
        id: "n2",
        title: "Risk Rules",
        content: "Never risk more than 1% per trade.",
        createdAt: new Date("2026-01-02T00:00:00Z"),
        updatedAt: new Date("2026-01-06T00:00:00Z"),
      },
    ]);
    const NotesPage = (await import("@/app/(dashboard)/notes/page.tsx")).default;
    const element = await NotesPage({
      searchParams: Promise.resolve({ q: "", sort: "updated" }),
    });
    render(<>{element}</>);
    expect(screen.getByText("ICT Concepts")).toBeInTheDocument();
    expect(screen.getByText("Risk Rules")).toBeInTheDocument();
    expect(screen.getAllByText(/Updated \d/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Created \d/i).length).toBeGreaterThanOrEqual(2);
  });
});
