import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import ExportPdfButton from "@/components/pdf/ExportPdfButton";
import type { ReportTrade } from "@/lib/pdf/generateReportPdf";

export const metadata: Metadata = { title: "Trade History" };

function formatPL(value: number | null) {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; direction?: string; outcome?: string }>;
}) {
  const user = await getUser();
  if (!user) return null;

  const params = await searchParams;
  const q = params.q?.toLowerCase() ?? "";
  const direction = params.direction ?? "";
  const outcome = params.outcome ?? "";

  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
      ...(direction ? { direction } : {}),
      ...(q ? { pair: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { entryTime: "desc" },
    include: { checklist: { select: { score: true } } },
  });

  // Filter outcome client-side (derived field)
  const filtered = outcome
    ? trades.filter((t) => {
        const pl = t.profitLoss ?? 0;
        if (outcome === "win") return pl > 0;
        if (outcome === "loss") return pl < 0;
        if (outcome === "open") return t.exitTime === null;
        return true;
      })
    : trades;

  const exportTrades: ReportTrade[] = filtered.map((t) => ({
    id: t.id,
    pair: t.pair,
    direction: t.direction,
    entryTime: t.entryTime.toISOString(),
    exitTime: t.exitTime ? t.exitTime.toISOString() : null,
    profitLoss: t.profitLoss ?? null,
    riskReward: t.riskReward ?? null,
    checklistScore: t.checklist?.score ?? null,
  }));

  const filterChips = [
    q ? `search: ${q}` : null,
    direction ? `direction: ${direction}` : null,
    outcome ? `outcome: ${outcome}` : null,
  ].filter(Boolean);
  const exportSubtitle = filterChips.length
    ? `Filtered · ${filterChips.join(" · ")}`
    : "All trades";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Trade History
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportPdfButton
            variant="report"
            enableRangePicker
            payload={{
              title: "Trade History",
              subtitle: exportSubtitle,
              filenameSlug: "trade-history",
              trades: exportTrades,
            }}
          />
          <Link href="/trades/new" className="btn btn-primary">
            + New Trade
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form
        style={{
          display: "flex",
          gap: 10,
          padding: "14px 16px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          flexWrap: "wrap",
        }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search pair or strategy…"
          className="input"
          style={{ width: 220 }}
        />
        <select name="direction" defaultValue={direction} className="input" style={{ width: 140 }}>
          <option value="">All directions</option>
          <option value="buy">Buy / Long</option>
          <option value="sell">Sell / Short</option>
        </select>
        <select name="outcome" defaultValue={outcome} className="input" style={{ width: 130 }}>
          <option value="">All outcomes</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
          <option value="open">Open</option>
        </select>
        <button type="submit" className="btn btn-secondary">Filter</button>
        {(q || direction || outcome) && (
          <Link href="/trades" className="btn btn-ghost">Clear</Link>
        )}
      </form>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text-muted)",
            fontSize: 14,
          }}
        >
          {q || direction || outcome ? "No trades match your filters." : "No trades yet. "}
          {!q && !direction && !outcome && (
            <Link href="/trades/new" style={{ color: "var(--accent)", textDecoration: "none" }}>
              Log your first trade →
            </Link>
          )}
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden" }}
        >
          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 90px 70px 70px",
              padding: "10px 20px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <span>Trade</span>
            <span>Direction</span>
            <span>Outcome</span>
            <span style={{ textAlign: "right" }}>P/L</span>
            <span style={{ textAlign: "right" }}>RR</span>
            <span style={{ textAlign: "right" }}>Checklist</span>
          </div>

          {filtered.map((t) => {
            const pl = t.profitLoss ?? null;
            const isWin = pl !== null && pl > 0;
            const isLoss = pl !== null && pl < 0;
            return (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="trade-row"
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {t.pair}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(t.entryTime).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {t.strategy ? ` · ${t.strategy}` : ""}
                  </p>
                </div>
                <span className={`badge ${t.direction === "buy" ? "badge-accent" : "badge-neutral"}`}>
                  {t.direction === "buy" ? "Buy" : "Sell"}
                </span>
                <span className={`badge ${isWin ? "badge-win" : isLoss ? "badge-loss" : "badge-neutral"}`}>
                  {isWin ? "Win" : isLoss ? "Loss" : "Open"}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isWin ? "var(--success)" : isLoss ? "var(--danger)" : "var(--text-muted)",
                    textAlign: "right",
                  }}
                >
                  {formatPL(pl)}
                </span>
                <span style={{ textAlign: "right", fontSize: 13, color: "var(--text-secondary)" }}>
                  {t.riskReward ? `${t.riskReward}` : "—"}
                </span>
                <span style={{ textAlign: "right", fontSize: 13, color: "var(--text-secondary)" }}>
                  {t.checklist?.score ?? 0}/16
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
