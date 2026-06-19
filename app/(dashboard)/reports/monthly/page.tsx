import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reports");
  return { title: t("monthlyTitle") };
}

function formatPL(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export default async function MonthlyReportPage() {
  const user = await getUser();
  if (!user) return null;

  const locale = await getLocale();
  const t = await getTranslations();
  const tReports = await getTranslations("reports");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: { userId: user.id, entryTime: { gte: monthStart, lte: monthEnd } },
    include: { checklist: { select: { score: true } } },
    orderBy: { entryTime: "desc" },
  });

  const total = trades.length;
  const wins = trades.filter((tr) => (tr.profitLoss ?? 0) > 0).length;
  const losses = trades.filter((tr) => (tr.profitLoss ?? 0) < 0).length;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const totalPL = trades.reduce((s, tr) => s + (tr.profitLoss ?? 0), 0);
  const avgRR = total ? trades.reduce((s, tr) => s + (tr.riskReward ?? 0), 0) / total : 0;
  const avgChecklist = total
    ? Math.round(trades.reduce((s, tr) => s + (tr.checklist?.score ?? 0), 0) / total)
    : 0;

  // Strategy performance
  const strategyMap: Record<string, { wins: number; total: number; pl: number }> = {};
  trades.forEach((tr) => {
    const s = tr.strategy ?? tReports("noStrategy");
    if (!strategyMap[s]) strategyMap[s] = { wins: 0, total: 0, pl: 0 };
    strategyMap[s].total++;
    if ((tr.profitLoss ?? 0) > 0) strategyMap[s].wins++;
    strategyMap[s].pl += tr.profitLoss ?? 0;
  });
  const strategies = Object.entries(strategyMap).sort((a, b) => b[1].pl - a[1].pl);

  // Average trade duration
  const durations = trades
    .filter((tr) => tr.exitTime)
    .map((tr) => new Date(tr.exitTime!).getTime() - new Date(tr.entryTime).getTime());
  const avgDurationMs = durations.length ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
  const avgDurationHrs = (avgDurationMs / 1000 / 60 / 60).toFixed(1);

  // Emotional consistency
  const mentalCounts: Record<string, number> = {};
  trades.forEach((tr) => {
    if (tr.mentalState) mentalCounts[tr.mentalState] = (mentalCounts[tr.mentalState] ?? 0) + 1;
  });

  const monthLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const monthName = new Intl.DateTimeFormat(monthLocale, { month: "long", year: "numeric" }).format(now);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            {tReports("monthlyTitle")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{monthName}</p>
        </div>
        <Link href="/reports/weekly" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
          {tReports("weeklyReportLink")}
        </Link>
      </div>

      {total === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 14 }}>
          {tReports("noTradesMonth")}{" "}
          <Link href="/trades/new" style={{ color: "var(--accent)", textDecoration: "none" }}>{tReports("logTrade")}</Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: tReports("statTotalTrades"), value: String(total), sub: tReports("winLossSummary", { wins, losses }) },
              { label: tReports("statWinRate"), value: `${winRate}%`, sub: tReports("subThisMonth"), color: winRate >= 60 ? "var(--success)" : winRate >= 40 ? "var(--warning)" : "var(--danger)" },
              { label: tReports("statTotalPL"), value: formatPL(totalPL), sub: tReports("subThisMonth"), color: totalPL >= 0 ? "var(--success)" : "var(--danger)" },
              { label: tReports("statAvgRR"), value: avgRR ? avgRR.toFixed(2) : "—", sub: tReports("subRiskToReward") },
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
              <p className="section-title">{tReports("avgTradeDuration")}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                {tReports("durationHours", { hrs: avgDurationHrs })}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{tReports("acrossClosedTrades")}</p>
            </div>

            <div className="card">
              <p className="section-title">{tReports("checklistAvg")}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", letterSpacing: "-0.03em" }}>{avgChecklist}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}> {tReports("checklistScoreOf", { avg: "" })}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--border)", marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(avgChecklist / 16) * 100}%`, background: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", borderRadius: 2 }} />
              </div>
            </div>

            <div className="card">
              <p className="section-title">{tReports("emotionalStates")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                {Object.entries(mentalCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([state, count]) => (
                    <div key={state} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{state}</span>
                      <span style={{ color: "var(--text-muted)" }}>{tReports("timesCount", { count })}</span>
                    </div>
                  ))}
                {Object.keys(mentalCounts).length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{tReports("noData")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Strategy Performance */}
          {strategies.length > 0 && (
            <div className="card">
              <p className="section-title">{tReports("strategyPerformance")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {strategies.map(([name, stats]) => (
                  <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 80px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{tReports("strategyTrades", { count: stats.total })}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{tReports("winRateValue", { rate: Math.round((stats.wins / stats.total) * 100) })}</span>
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
