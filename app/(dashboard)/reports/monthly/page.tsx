import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import ExportPdfButton from "@/components/pdf/ExportPdfButton";
import type { ReportTrade } from "@/lib/pdf/generateReportPdf";

export const metadata: Metadata = { title: "Monthly Report" };

function formatPL(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export default async function MonthlyReportPage() {
  const user = await getUser();
  if (!user) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: { userId: user.id, entryTime: { gte: monthStart, lte: monthEnd } },
    include: { checklist: { select: { score: true } } },
    orderBy: { entryTime: "desc" },
  });

  const total = trades.length;
  const wins = trades.filter((t) => (t.profitLoss ?? 0) > 0).length;
  const losses = trades.filter((t) => (t.profitLoss ?? 0) < 0).length;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const totalPL = trades.reduce((s, t) => s + (t.profitLoss ?? 0), 0);
  const avgRR = total ? trades.reduce((s, t) => s + (t.riskReward ?? 0), 0) / total : 0;
  const avgChecklist = total
    ? Math.round(trades.reduce((s, t) => s + (t.checklist?.score ?? 0), 0) / total)
    : 0;

  // Strategy performance
  const strategyMap: Record<string, { wins: number; total: number; pl: number }> = {};
  trades.forEach((t) => {
    const s = t.strategy ?? "No Strategy";
    if (!strategyMap[s]) strategyMap[s] = { wins: 0, total: 0, pl: 0 };
    strategyMap[s].total++;
    if ((t.profitLoss ?? 0) > 0) strategyMap[s].wins++;
    strategyMap[s].pl += t.profitLoss ?? 0;
  });
  const strategies = Object.entries(strategyMap).sort((a, b) => b[1].pl - a[1].pl);

  // Average trade duration
  const durations = trades
    .filter((t) => t.exitTime)
    .map((t) => new Date(t.exitTime!).getTime() - new Date(t.entryTime).getTime());
  const avgDurationMs = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
  const avgDurationHrs = (avgDurationMs / 1000 / 60 / 60).toFixed(1);

  // Emotional consistency
  const mentalCounts: Record<string, number> = {};
  trades.forEach((t) => {
    if (t.mentalState) mentalCounts[t.mentalState] = (mentalCounts[t.mentalState] ?? 0) + 1;
  });

  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const exportTrades: ReportTrade[] = trades.map((t) => ({
    id: t.id,
    pair: t.pair,
    direction: t.direction,
    entryTime: t.entryTime.toISOString(),
    exitTime: t.exitTime ? t.exitTime.toISOString() : null,
    profitLoss: t.profitLoss ?? null,
    riskReward: t.riskReward ?? null,
    checklistScore: t.checklist?.score ?? null,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Monthly Report
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{monthName}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ExportPdfButton
            variant="report"
            payload={{
              title: "Monthly Report",
              subtitle: monthName,
              dateRange: monthName,
              filenameSlug: "monthly",
              trades: exportTrades,
            }}
          />
          <Link href="/reports/weekly" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
            ← Weekly report
          </Link>
        </div>
      </div>

      {total === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 14 }}>
          No trades this month.{" "}
          <Link href="/trades/new" style={{ color: "var(--accent)", textDecoration: "none" }}>Log a trade →</Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: "Total Trades", value: String(total), sub: `${wins}W / ${losses}L` },
              { label: "Win Rate", value: `${winRate}%`, sub: "this month", color: winRate >= 60 ? "var(--success)" : winRate >= 40 ? "var(--warning)" : "var(--danger)" },
              { label: "Total P/L", value: formatPL(totalPL), sub: "this month", color: totalPL >= 0 ? "var(--success)" : "var(--danger)" },
              { label: "Avg RR", value: avgRR ? avgRR.toFixed(2) : "—", sub: "risk-to-reward" },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <p className="stat-label">{s.label}</p>
                <p className="stat-value" style={s.color ? { color: s.color } : undefined}>{s.value}</p>
                <p className="stat-sub">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Insights Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div className="card">
              <p className="section-title">Avg Trade Duration</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                {avgDurationHrs}h
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>across closed trades</p>
            </div>

            <div className="card">
              <p className="section-title">Checklist Avg</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", letterSpacing: "-0.03em" }}>{avgChecklist}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}> / 16</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--border)", marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(avgChecklist / 16) * 100}%`, background: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", borderRadius: 2 }} />
              </div>
            </div>

            <div className="card">
              <p className="section-title">Emotional States</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                {Object.entries(mentalCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([state, count]) => (
                    <div key={state} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{state}</span>
                      <span style={{ color: "var(--text-muted)" }}>{count}x</span>
                    </div>
                  ))}
                {Object.keys(mentalCounts).length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No data</p>
                )}
              </div>
            </div>
          </div>

          {/* Strategy Performance */}
          {strategies.length > 0 && (
            <div className="card">
              <p className="section-title">Strategy Performance</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {strategies.map(([name, stats]) => (
                  <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 80px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{stats.total} trades</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{Math.round((stats.wins / stats.total) * 100)}% WR</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: stats.pl >= 0 ? "var(--success)" : "var(--danger)", textAlign: "right" }}>
                      {formatPL(stats.pl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
