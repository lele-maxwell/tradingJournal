"use client";

import { useState, useTransition } from "react";
import { BUILTIN_SPECS } from "@/lib/trading/specs";
import { pinSymbolAction } from "@/lib/actions/profile.actions";

interface AddPinControlProps {
  /** Called after a successful pin so the parent can update its state. */
  onAdded: (symbol: string) => void;
}

const SYMBOLS = Object.keys(BUILTIN_SPECS);

export default function AddPinControl({ onAdded }: AddPinControlProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePin(symbol: string) {
    setError(null);
    startTransition(async () => {
      const result = await pinSymbolAction(symbol);
      if (result.error) {
        setError(result.error);
        return;
      }
      onAdded(symbol);
      setOpen(false);
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        disabled={pending}
      >
        + Pin
      </button>
      {open && (
        <div
          className="ticker-pin-menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 7,
            padding: 6,
            zIndex: 50,
            minWidth: 180,
            maxHeight: 240,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {SYMBOLS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => handlePin(sym)}
              disabled={pending}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                fontSize: 13,
                borderRadius: 5,
                background: "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                border: "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
            >
              {sym}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, position: "absolute", right: 0, top: "100%" }}>
          {error}
        </p>
      )}
    </div>
  );
}
