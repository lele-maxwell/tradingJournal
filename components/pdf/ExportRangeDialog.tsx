"use client";

import { useEffect, useState } from "react";

export type ExportRange =
  | { kind: "all" }
  | { kind: "last7" }
  | { kind: "last30" }
  | { kind: "custom"; from: string; to: string };

type Props = {
  onConfirm: (range: ExportRange) => void;
  onCancel: () => void;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ExportRangeDialog({ onConfirm, onCancel }: Props) {
  const [selection, setSelection] = useState<"all" | "last7" | "last30" | "custom">("all");
  const [from, setFrom] = useState<string>(daysAgoIso(30));
  const [to, setTo] = useState<string>(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleConfirm() {
    if (selection === "all") return onConfirm({ kind: "all" });
    if (selection === "last7") return onConfirm({ kind: "last7" });
    if (selection === "last30") return onConfirm({ kind: "last30" });
    // custom
    if (!from || !to) {
      setError("Pick both a start and end date.");
      return;
    }
    if (from > to) {
      setError("Start date must be on or before end date.");
      return;
    }
    setError(null);
    onConfirm({ kind: "custom", from, to });
  }

  const choices: { id: typeof selection; label: string; sub: string }[] = [
    { id: "all", label: "All trades", sub: "Entire history" },
    { id: "last7", label: "Last 7 days", sub: "Past week" },
    { id: "last30", label: "Last 30 days", sub: "Past month" },
    { id: "custom", label: "Custom range", sub: "Pick dates" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-range-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 440, padding: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2
            id="export-range-title"
            style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Export PDF
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="btn btn-ghost btn-sm"
            style={{ padding: "2px 6px" }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Choose the date range to include in the report.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {choices.map((c) => {
            const active = selection === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setSelection(c.id)}
                style={{
                  textAlign: "left",
                  background: active ? "var(--accent-muted)" : "var(--bg-surface-2)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 7,
                  padding: "10px 12px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "border-color 0.12s, background 0.12s",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--accent)" : "var(--text-primary)" }}>
                  {c.label}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.sub}</p>
              </button>
            );
          })}
        </div>

        {selection === "custom" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label htmlFor="export-from" className="label">From</label>
              <input
                id="export-from"
                type="date"
                className="input"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="export-to" className="label">To</label>
              <input
                id="export-to"
                type="date"
                className="input"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && <p className="error-msg" style={{ marginBottom: 8 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
