"use client";

import { useActionState, useState } from "react";
import { addCustomAssetAction, type ProfileActionState } from "@/lib/actions/profile.actions";
import type { AssetCategory } from "@/lib/trading/specs";

const CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: "forex", label: "Forex" },
  { value: "index", label: "Index" },
  { value: "futures", label: "Futures" },
  { value: "crypto", label: "Crypto" },
  { value: "stock", label: "Stock" },
];

export default function CustomAssetForm() {
  const initialState: ProfileActionState = {};
  const [state, action, pending] = useActionState(addCustomAssetAction, initialState);
  const [open, setOpen] = useState(false);
  // Bumped after a successful submission so the inner <form> remounts in a closed state.
  const [resetKey, setResetKey] = useState(0);

  if (state.success && open) {
    setOpen(false);
    setResetKey((k) => k + 1);
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Cancel" : "+ Add Custom Asset"}
      </button>
      {open && (
        <form
          key={resetKey}
          action={action}
          style={{
            marginTop: 8,
            padding: 12,
            border: "1px solid var(--border)",
            borderRadius: 7,
            background: "var(--bg-surface-2)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
            gap: 8,
            alignItems: "end",
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Symbol *</span>
            <input
              name="symbol"
              placeholder="e.g. EUR/SEK"
              required
              className={`input ${state.fieldErrors?.symbol ? "input-error" : ""}`}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Category *</span>
            <select name="category" className="input" defaultValue="forex">
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Contract Size</span>
            <input name="contractSize" type="number" step="any" placeholder="100000" className="input" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Pip Value</span>
            <input name="pipValue" type="number" step="any" placeholder="0.0001" className="input" />
          </label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          {state.error && (
            <p style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--danger)", marginTop: 6 }}>
              {state.error}
            </p>
          )}
          {state.fieldErrors && Object.entries(state.fieldErrors).map(([k, v]) => (
            <p key={k} style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--danger)", marginTop: 6 }}>
              {k}: {v.join(", ")}
            </p>
          ))}
        </form>
      )}
    </div>
  );
}
