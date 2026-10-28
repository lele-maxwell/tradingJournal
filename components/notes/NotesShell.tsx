"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * Layout shell for the /notes section. The notes workspace owns its own
 * two-pane chrome (list on the left, editor on the right) so the dashboard's
 * fixed <Sidebar /> only renders on the outer dashboard route group.
 *
 * On mobile, the panes stack vertically; the list pane collapses to a
 * compact bar with a "Back" affordance when an editor is open.
 */
export default function NotesShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onEditor = /^\/notes\/[^/]+/.test(pathname) && pathname !== "/notes";
  const onNew = pathname === "/notes/new";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {onEditor || onNew ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/notes" className="btn btn-ghost btn-sm" aria-label="Back to notes list">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All notes
          </Link>
        </div>
      ) : null}
      {children}
    </div>
  );
}
