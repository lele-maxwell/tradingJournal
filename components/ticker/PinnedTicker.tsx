"use client";

import { useEffect, useState, useTransition } from "react";
import type { Quote } from "@/lib/trading/prices";
import AddPinControl from "@/components/ticker/AddPinControl";
import { unpinSymbolAction } from "@/lib/actions/profile.actions";

interface PinnedTickerProps {
  initialSymbols: string[];
}

interface QuoteState {
  bySymbol: Record<string, Quote>;
  loading: boolean;
  error: string | null;
}

const POLL_MS = 15_000;

export default function PinnedTicker({ initialSymbols }: PinnedTickerProps) {
  const [symbols, setSymbols] = useState<string[]>(initialSymbols);
  const [, startUnpin] = useTransition();
  const [state, setState] = useState<QuoteState>({
    bySymbol: {},
    loading: false,
    error: null,
  });

  function handleUnpin(sym: string) {
    startUnpin(async () => {
      const result = await unpinSymbolAction(sym);
      if (result.error) {
        setState((s) => ({ ...s, error: result.error ?? null }));
        return;
      }
      setSymbols((prev) => prev.filter((s) => s !== sym));
    });
  }

  useEffect(() => {
    let cancelled = false;
    if (symbols.length === 0) {
      setState({ bySymbol: {}, loading: false, error: null });
      return;
    }
    const fetchOnce = async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const url = `/api/ticker?symbols=${encodeURIComponent(symbols.join(","))}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { quotes: Quote[] };
        if (cancelled) return;
        const bySymbol: Record<string, Quote> = {};
        for (const q of json.quotes) bySymbol[q.symbol] = q;
        setState({ bySymbol, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch quotes",
        }));
      }
    };
    fetchOnce();
    const id = setInterval(fetchOnce, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbols]);

  return (
    <div className="card" data-testid="pinned-ticker">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Pinned Ticker</h2>
          <span
            className={`ticker-dot ${state.loading ? "ticker-dot-loading" : "ticker-dot-idle"}`}
            aria-hidden
          />
        </div>
        <AddPinControl
          onAdded={(sym) => {
            if (!symbols.includes(sym)) setSymbols((prev) => [...prev, sym]);
          }}
        />
      </div>

      {symbols.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 0" }}>
          No pinned assets. Use the &quot;+ Pin&quot; button above to add one.
        </p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
          {symbols.map((sym) => {
            const q = state.bySymbol[sym];
            const up = q ? q.changePct > 0 : false;
            const down = q ? q.changePct < 0 : false;
            const color = up ? "var(--success)" : down ? "var(--danger)" : "var(--text-muted)";
            return (
              <li
                key={sym}
                className="ticker-row"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{sym}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {q ? new Date(q.ts).toLocaleTimeString() : "loading…"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {q ? q.price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}
                    </span>
                    {q && (
                      <span style={{ fontSize: 11, color, fontVariantNumeric: "tabular-nums" }}>
                        {q.changePct > 0 ? "+" : ""}{q.changePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnpin(sym)}
                    aria-label={`Unpin ${sym}`}
                    title={`Unpin ${sym}`}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 14,
                      lineHeight: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {state.error && (
        <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 8 }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
