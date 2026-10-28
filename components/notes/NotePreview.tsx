"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Read-only rendered preview of a note's markdown body.
 * GFM gives us tables, task-list checkboxes, strikethrough, and autolinks.
 * We do NOT install rehype-raw, so user-supplied HTML is escaped — that's
 * the default and the safe choice for user-authored notes.
 */
export default function NotePreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          fontStyle: "italic",
          margin: 0,
        }}
      >
        Nothing to preview yet.
      </p>
    );
  }

  return (
    <div className="markdown-preview" data-testid="note-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...rest }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...rest}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
