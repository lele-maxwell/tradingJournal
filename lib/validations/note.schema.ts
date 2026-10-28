import { z } from "zod";

export const NOTE_TITLE_MAX = 200;
export const NOTE_CONTENT_MAX = 200_000;

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(NOTE_TITLE_MAX, `Title must be ${NOTE_TITLE_MAX} characters or fewer`),
  content: z
    .string()
    .max(NOTE_CONTENT_MAX, `Note content must be ${NOTE_CONTENT_MAX} characters or fewer`)
    .default(""),
});

export type NoteFormData = z.infer<typeof noteSchema>;

export const updateNoteSchema = noteSchema.extend({
  id: z.string().min(1, "Note id is required"),
  /**
   * `expectedUpdatedAt` is the `updatedAt` value the client had when it started
   * editing. The server checks it before writing so two tabs can't silently
   * clobber each other (auto-save race condition guard).
   */
  expectedUpdatedAt: z.string().optional(),
});

export type UpdateNoteFormData = z.infer<typeof updateNoteSchema>;

export const deleteNoteSchema = z.object({
  id: z.string().min(1, "Note id is required"),
});

export type DeleteNoteFormData = z.infer<typeof deleteNoteSchema>;

/**
 * Strip markdown to a plain-text excerpt for list previews.
 * Conservative: it removes fenced code, inline code, links/images (keeps
 * the label), emphasis markers, list bullets, headings, and HTML tags.
 * Whitespace is collapsed.
 */
export function noteExcerpt(content: string, max = 140): string {
  if (!content) return "";
  const stripped = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>+\s?/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max - 1).trimEnd() + "\u2026";
}
