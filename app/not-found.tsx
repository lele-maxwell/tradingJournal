export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        textAlign: "center",
        padding: 24,
      }}
    >
      <p style={{ fontSize: 48, lineHeight: 1 }}>🔍</p>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
        Page not found
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a href="/dashboard" className="btn btn-primary">
        Go to Dashboard
      </a>
    </div>
  );
}
