import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import NotesShell from "@/components/notes/NotesShell";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return <NotesShell>{children}</NotesShell>;
}
