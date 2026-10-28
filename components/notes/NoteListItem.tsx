import Link from "next/link";

export default function NoteListItem({
  href,
  title,
  excerpt,
  createdAt,
  updatedAt,
}: {
  href: string;
  title: string;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
}) {
  return (
    <li style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <Link
        href={href}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "16px 20px",
          textDecoration: "none",
          transition: "background 0.1s",
        }}
        className="note-row"
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={title}
          >
            {title}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
            Updated {updatedAt}
          </span>
        </div>
        {excerpt ? (
          <p
            style={{
              fontSize: 12.5,
              color: "var(--text-secondary)",
              margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {excerpt}
          </p>
        ) : null}
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
          Created {createdAt}
        </p>
      </Link>
    </li>
  );
}
