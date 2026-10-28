import { describe, it, expect } from "vitest";
import {
  noteSchema,
  updateNoteSchema,
  deleteNoteSchema,
  noteExcerpt,
  NOTE_TITLE_MAX,
  NOTE_CONTENT_MAX,
} from "@/lib/validations/note.schema";

describe("noteSchema", () => {
  it("accepts a valid title and content", () => {
    const r = noteSchema.safeParse({ title: "Hello", content: "Body" });
    expect(r.success).toBe(true);
  });

  it("trims and rejects whitespace-only titles", () => {
    const r = noteSchema.safeParse({ title: "   ", content: "" });
    expect(r.success).toBe(false);
  });

  it("rejects empty titles", () => {
    const r = noteSchema.safeParse({ title: "", content: "x" });
    expect(r.success).toBe(false);
  });

  it("rejects titles over NOTE_TITLE_MAX", () => {
    const r = noteSchema.safeParse({
      title: "a".repeat(NOTE_TITLE_MAX + 1),
      content: "",
    });
    expect(r.success).toBe(false);
  });

  it("accepts content up to NOTE_CONTENT_MAX", () => {
    const r = noteSchema.safeParse({
      title: "t",
      content: "x".repeat(NOTE_CONTENT_MAX),
    });
    expect(r.success).toBe(true);
  });

  it("rejects content above NOTE_CONTENT_MAX", () => {
    const r = noteSchema.safeParse({
      title: "t",
      content: "x".repeat(NOTE_CONTENT_MAX + 1),
    });
    expect(r.success).toBe(false);
  });

  it("defaults content to empty string when undefined", () => {
    const r = noteSchema.safeParse({ title: "t" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.content).toBe("");
  });
});

describe("updateNoteSchema", () => {
  it("requires id and accepts expectedUpdatedAt", () => {
    const r = updateNoteSchema.safeParse({
      id: "abc",
      title: "t",
      content: "c",
      expectedUpdatedAt: new Date().toISOString(),
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty id", () => {
    const r = updateNoteSchema.safeParse({ id: "", title: "t", content: "" });
    expect(r.success).toBe(false);
  });
});

describe("deleteNoteSchema", () => {
  it("requires id", () => {
    expect(deleteNoteSchema.safeParse({}).success).toBe(false);
    expect(deleteNoteSchema.safeParse({ id: "abc" }).success).toBe(true);
  });
});

describe("noteExcerpt", () => {
  it("returns empty string for empty content", () => {
    expect(noteExcerpt("")).toBe("");
  });

  it("strips fenced code blocks", () => {
    const out = noteExcerpt("Before\n```js\nx = 1\n```\nAfter");
    expect(out).not.toContain("x = 1");
    expect(out).toContain("Before");
    expect(out).toContain("After");
  });

  it("strips emphasis markers and headings", () => {
    expect(noteExcerpt("**Bold** *it*")).toBe("Bold it");
    expect(noteExcerpt("# Title\nbody")).toBe("Title body");
  });

  it("keeps link text, drops url", () => {
    expect(noteExcerpt("See [docs](https://example.com)")).toBe("See docs");
  });

  it("truncates with ellipsis when over the limit", () => {
    const long = "word ".repeat(80);
    const out = noteExcerpt(long, 30);
    expect(out.length).toBeLessThanOrEqual(30);
    expect(out.endsWith("\u2026")).toBe(true);
  });
});
