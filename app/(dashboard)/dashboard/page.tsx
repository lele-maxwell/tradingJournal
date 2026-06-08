import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

type TradeWithPL = { profitLoss: number | null; riskReward: number | null };
type TradeWithChecklist = { id: string; pair: string; direction: string; entryTime: Date; profitLoss: number | null; checklist: { score: number } | null };
type TradeProfitOnly = { profitLoss: number | null };

function formatPL(value: number | null) {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function winRateColor(rate: number) {
  if (rate >= 60) return "var(--success)";
  if (rate >= 40) return "var(--warning)";
  return "var(--danger)";
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return null;

  // Fetch stats + recent trades + weekly trades in parallel
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const [allTrades, recentTrades, weekTrades] = await Promise.all([
    prisma.trade.findMany({
      where: { userId: user.id },
      select: { profitLoss: true, riskReward: true },
    }),
    prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { entryTime: "desc" },
      take: 6,
      include: { checklist: { select: { score: true } } },
    }),
    prisma.trade.findMany({
      where: { userId: user.id, entryTime: { gte: weekStart } },
      select: { profitLoss: true },
    }),
  ]);

  const total = allTrades.length;
  const wins = allTrades.filter((t: TradeWithPL) => (t.profitLoss ?? 0) > 0).length;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const totalPL = allTrades.reduce((s: number, t: TradeWithPL) => s + (t.profitLoss ?? 0), 0);
  const avgRR =
    total
      ? allTrades.reduce((s: number, t: TradeWithPL) => s + (t.riskReward ?? 0), 0) / total
      : 0;
  const weekPL = weekTrades.reduce((s: number, t: TradeProfitOnly) => s + (t.profitLoss ?? 0), 0);
  const avgChecklist =
    recentTrades.length
      ? Math.round(
          recentTrades.reduce((s: number, t: TradeWithChecklist) => s + (t.checklist?.score ?? 0), 0) /
            recentTrades.length
        )
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Your trading performance overview
          </p>
        </div>
        <Link href="/trades/new" className="btn btn-primary">
          + New Trade
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard label="Total Trades" value={String(total)} sub="all time" />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${wins}W / ${total - wins}L`}
          valueColor={total ? winRateColor(winRate) : undefined}
        />
        <StatCard
          label="Total P/L"
          value={formatPL(totalPL)}
          sub="across all trades"
          valueColor={totalPL >= 0 ? "var(--success)" : "var(--danger)"}
        />
        <StatCard
          label="Avg RR"
          value={avgRR ? `${avgRR.toFixed(2)}` : "—"}
          sub="risk-to-reward"
        />
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        {/* Recent Trades */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Recent Trades</h2>
            <Link href="/trades" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {recentTrades.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No trades yet.{" "}
              <Link href="/trades/new" style={{ color: "var(--accent)", textDecoration: "none" }}>
                Log your first trade
              </Link>
            </div>
          ) : (
            <div>
              {recentTrades.map((t: TradeWithChecklist) => {
                const pl = t.profitLoss ?? null;
                const isWin = pl !== null && pl > 0;
                const isLoss = pl !== null && pl < 0;
                return (
                  <Link
                    key={t.id}
                    href={`/trades/${t.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto auto",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 20px",
                      borderBottom: "1px solid var(--border-subtle)",
                      textDecoration: "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {t.pair}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {t.direction.toUpperCase()} · {new Date(t.entryTime).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`badge ${isWin ? "badge-win" : isLoss ? "badge-loss" : "badge-neutral"}`}
                    >
                      {isWin ? "Win" : isLoss ? "Loss" : "Open"}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isWin ? "var(--success)" : isLoss ? "var(--danger)" : "var(--text-muted)", minWidth: 60, textAlign: "right" }}>
                      {pl !== null ? formatPL(pl) : "—"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {t.checklist?.score ?? 0}/16
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* This Week */}
          <div className="card">
            <p className="section-title">This Week</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: weekPL >= 0 ? "var(--success)" : "var(--danger)", letterSpacing: "-0.03em" }}>
              {formatPL(weekPL)}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {weekTrades.length} trade{weekTrades.length !== 1 ? "s" : ""}
            </p>
            <Link href="/reports/weekly" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none", display: "block", marginTop: 12 }}>
              Full weekly report →
            </Link>
          </div>

          {/* Checklist Quality */}
          <div className="card">
            <p className="section-title">Avg Checklist Score</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", letterSpacing: "-0.03em" }}>
                {avgChecklist}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}> / 16</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "var(--border)", marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(avgChecklist / 16) * 100}%`, background: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              {avgChecklist >= 10 ? "Good setup quality" : avgChecklist >= 6 ? "Room to improve" : "Review your entries"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, valueColor }: { label: string; value: string; sub: string; valueColor?: string }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={valueColor ? { color: valueColor } : undefined}>{value}</p>
      <p className="stat-sub">{sub}</p>
    </div>
  );
}
