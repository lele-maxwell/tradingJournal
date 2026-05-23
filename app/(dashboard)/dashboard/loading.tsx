export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.2s ease" }}>
      {/* Header skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="skeleton" style={{ width: 160, height: 22, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 14 }} />
        </div>
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 7 }} />
      </div>
      {/* Stats skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="skeleton" style={{ width: 80, height: 12 }} />
            <div className="skeleton" style={{ width: 60, height: 28 }} />
            <div className="skeleton" style={{ width: 100, height: 12 }} />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <div className="card" style={{ height: 300 }}>
          <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 8 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ height: 130 }}>
            <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 8 }} />
          </div>
          <div className="card" style={{ height: 130 }}>
            <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
