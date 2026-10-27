"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import {
  noteSchema,
  updateNoteSchema,
  deleteNoteSchema,
} from "@/lib/validations/note.schema";

export type NoteActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type NoteSort = "updated" | "created" | "alpha";

const SORT_OPTIONS: Record<NoteSort, { updatedAt?: "desc"; createdAt?: "desc"; title?: "asc" }> = {
  updated: { updatedAt: "desc" },
  created: { createdAt: "desc" },
  alpha: { title: "asc" },
};

function parseSort(value: string | undefined): NoteSort {
  if (value === "created" || value === "alpha") return value;
  return "updated";
}

export async function createNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content") ?? "",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const created = await prisma.note.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
    },
    select: { id: true },
  });

  revalidatePath("/notes");
  redirect(`/notes/${created.id}`);
}

export async function updateNoteAction(
  _prevState: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = updateNoteSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    content: formData.get("content") ?? "",
    expectedUpdatedAt: formData.get("expectedUpdatedAt") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  // Optimistic concurrency guard: refuse to overwrite if another tab saved
  // a newer version since the user started editing.
  if (parsed.data.expectedUpdatedAt) {
    const current = await prisma.note.findFirst({
      where: { id: parsed.data.id, userId: user.id },
      select: { updatedAt: true },
    });
    if (current && current.updatedAt.toISOString() !== parsed.data.expectedUpdatedAt) {
      return {
        error:
          "This note was modified in another tab. Reload to see the latest version before saving again.",
      };
    }
  }

  const result = await prisma.note.updateMany({
    where: { id: parsed.data.id, userId: user.id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  if (result.count === 0) {
    return { error: "Note not found or you do not have permission to edit it." };
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${parsed.data.id}`);
  return {};
}

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = deleteNoteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    redirect("/notes");
  }

  await prisma.note.deleteMany({
    where: { id: parsed.data.id, userId: user.id },
  });

  revalidatePath("/notes");
  redirect("/notes");
}

export async function listNotes(opts: {
  q?: string;
  sort?: string;
}): Promise<Array<{
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}>> {
  const user = await getUser();
  if (!user) return [];

  const sort = parseSort(opts.sort);
  const q = opts.q?.trim() ?? "";
  const orderBy = SORT_OPTIONS[sort];

  return prisma.note.findMany({
    where: {
      userId: user.id,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy,
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getNote(id: string) {
  const user = await getUser();
  if (!user) return null;

  return prisma.note.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
