import { describe, it, expect, vi, beforeEach } from "vitest";

const noteStore = new Map<string, Record<string, unknown>>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      create: vi.fn(({ data }) => {
        const id = `n_${noteStore.size + 1}`;
        noteStore.set(id, {
          id,
          userId: data.userId,
          title: data.title,
          content: data.content ?? "",
          updatedAt: new Date(),
          createdAt: new Date(),
        });
        return Promise.resolve({ id });
      }),
      updateMany: vi.fn(({ where, data }) => {
        const existing = noteStore.get(where.id);
        if (!existing || existing.userId !== where.userId) {
          return Promise.resolve({ count: 0 });
        }
        noteStore.set(where.id, { ...existing, ...data });
        return Promise.resolve({ count: 1 });
      }),
      deleteMany: vi.fn(({ where }) => {
        const existing = noteStore.get(where.id);
        if (!existing || existing.userId !== where.userId) {
          return Promise.resolve({ count: 0 });
        }
        noteStore.delete(where.id);
        return Promise.resolve({ count: 1 });
      }),
      findFirst: vi.fn(({ where }) => {
        const existing = noteStore.get(where.id);
        if (!existing || existing.userId !== where.userId) return Promise.resolve(null);
        return Promise.resolve(existing);
      }),
      findMany: vi.fn(({ where, orderBy }) => {
        let items = [...noteStore.values()].filter(
          (n) => n.userId === where.userId
        );
        if (where.OR) {
          items = items.filter((n) =>
            where.OR.some((clause: Record<string, unknown>) => {
              const titleClause = clause.title as { contains?: string; mode?: string } | undefined;
              const contentClause = clause.content as { contains?: string; mode?: string } | undefined;
              if (titleClause?.contains && String(n.title).toLowerCase().includes(titleClause.contains.toLowerCase())) {
                return true;
              }
              if (contentClause?.contains && String(n.content).toLowerCase().includes(contentClause.contains.toLowerCase())) {
                return true;
              }
              return false;
            })
          );
        }
        if (orderBy?.updatedAt === "desc") {
          items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
        } else if (orderBy?.title === "asc") {
          items.sort((a, b) => String(a.title).localeCompare(String(b.title)));
        }
        return Promise.resolve(items);
      }),
    },
  },
}));

const user = { id: "u_1" };
vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(async () => user),
}));

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  listNotes,
  getNote,
} from "@/lib/actions/note.actions";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

beforeEach(() => {
  noteStore.clear();
  redirectMock.mockClear();
});

describe("createNoteAction", () => {
  it("creates a note and redirects to /notes/:id", async () => {
    await expect(
      createNoteAction({}, fd({ title: "Plan", content: "Body" }))
    ).rejects.toThrow(/NEXT_REDIRECT:\/notes\//);
    expect(noteStore.size).toBe(1);
    expect([...noteStore.values()][0].title).toBe("Plan");
  });

  it("rejects empty title with fieldErrors", async () => {
    const result = await createNoteAction({}, fd({ title: "  ", content: "x" }));
    expect(result.fieldErrors?.title).toBeDefined();
  });
});

describe("updateNoteAction", () => {
  it("updates a note owned by the user", async () => {
    await expect(
      createNoteAction({}, fd({ title: "old", content: "old body" }))
    ).rejects.toThrow();
    const id = [...noteStore.keys()][0];
    const r = await updateNoteAction({}, fd({ id, title: "new", content: "new body" }));
    expect(r).toEqual({});
    expect(noteStore.get(id)?.title).toBe("new");
  });

  it("refuses to update a foreign note", async () => {
    noteStore.set("nX", {
      id: "nX",
      userId: "someone-else",
      title: "X",
      content: "X",
      updatedAt: new Date(),
      createdAt: new Date(),
    });
    const r = await updateNoteAction({}, fd({ id: "nX", title: "hijack", content: "x" }));
    expect(r.error).toMatch(/not found|permission/i);
    expect(noteStore.get("nX")?.title).toBe("X");
  });
});

describe("deleteNoteAction", () => {
  it("deletes an owned note and redirects to /notes", async () => {
    await expect(
      createNoteAction({}, fd({ title: "x", content: "y" }))
    ).rejects.toThrow();
    const id = [...noteStore.keys()][0];
    await expect(deleteNoteAction(fd({ id }))).rejects.toThrow(/NEXT_REDIRECT:\/notes/);
    expect(noteStore.has(id)).toBe(false);
  });
});

describe("listNotes", () => {
  it("filters by title substring case-insensitively", async () => {
    await expect(
      createNoteAction({}, fd({ title: "ICT Setup", content: "" }))
    ).rejects.toThrow();
    await expect(
      createNoteAction({}, fd({ title: "Risk Rules", content: "" }))
    ).rejects.toThrow();
    const out = await listNotes({ q: "ict" });
    expect(out.length).toBe(1);
    expect(out[0].title).toBe("ICT Setup");
  });

  it("filters by content substring", async () => {
    await expect(
      createNoteAction({}, fd({ title: "A", content: "contains keyword alpha" }))
    ).rejects.toThrow();
    await expect(
      createNoteAction({}, fd({ title: "B", content: "plain text" }))
    ).rejects.toThrow();
    const out = await listNotes({ q: "keyword" });
    expect(out.length).toBe(1);
    expect(out[0].title).toBe("A");
  });

  it("sorts alphabetically when requested", async () => {
    await expect(
      createNoteAction({}, fd({ title: "Banana", content: "" }))
    ).rejects.toThrow();
    await expect(
      createNoteAction({}, fd({ title: "Apple", content: "" }))
    ).rejects.toThrow();
    const out = await listNotes({ sort: "alpha" });
    expect(out.map((n) => n.title)).toEqual(["Apple", "Banana"]);
  });
});

describe("getNote", () => {
  it("returns the note for the owner", async () => {
    await expect(
      createNoteAction({}, fd({ title: "mine", content: "c" }))
    ).rejects.toThrow();
    const id = [...noteStore.keys()][0];
    const n = await getNote(id);
    expect(n?.title).toBe("mine");
  });

  it("returns null for a foreign note", async () => {
    noteStore.set("nY", {
      id: "nY",
      userId: "other",
      title: "other",
      content: "",
      updatedAt: new Date(),
      createdAt: new Date(),
    });
    const n = await getNote("nY");
    expect(n).toBeNull();
  });
});
