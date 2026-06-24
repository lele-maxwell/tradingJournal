import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reports");
  return { title: t("weeklyTitle") };
}

function formatPL(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

const MENTAL_STATE_EMOJI: Record<string, string> = {
  calm: "😌",
  focused: "🎯",
  fearful: "😨",
  tired: "😴",
  overconfident: "😤",
  revenge: "😤",
  emotional: "😰",
  distracted: "🙃",
};

export default async function WeeklyReportPage() {
  const user = await getUser();
  if (!user) return null;

  const locale = await getLocale();
  const t = await getTranslations();
  const tReports = await getTranslations("reports");

  // Mon–Sun of current week
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diffToMon);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: { userId: user.id, entryTime: { gte: weekStart, lte: weekEnd } },
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

  // Mental state overview
  const mentalCounts: Record<string, number> = {};
  trades.forEach((tr) => {
    if (tr.mentalState) mentalCounts[tr.mentalState] = (mentalCounts[tr.mentalState] ?? 0) + 1;
  });
  const topMentalState = Object.entries(mentalCounts).sort((a, b) => b[1] - a[1])[0];

  // Most common mistake
  const mistakes = trades.filter((tr) => tr.mistakeNotes).map((tr) => tr.mistakeNotes!);

  const rangeLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const fmtShort = new Intl.DateTimeFormat(rangeLocale, { day: "numeric", month: "short" });
  const fmtShortYear = new Intl.DateTimeFormat(rangeLocale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            {tReports("weeklyTitle")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {tReports("dateRange", { start: fmtShort.format(weekStart), end: fmtShortYear.format(weekEnd) })}
          </p>
        </div>
        <Link href="/reports/monthly" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
          {tReports("monthlyReportLink")}
        </Link>
      </div>

      {total === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 14 }}>
          {tReports("noTradesWeek")}{" "}
          <Link href="/trades/new" style={{ color: "var(--accent)", textDecoration: "none" }}>{tReports("logTrade")}</Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: tReports("statTotalTrades"), value: String(total), sub: tReports("winLossSummary", { wins, losses }) },
              { label: tReports("statWinRate"), value: `${winRate}%`, sub: tReports("subThisWeek"), color: winRate >= 60 ? "var(--success)" : winRate >= 40 ? "var(--warning)" : "var(--danger)" },
              { label: tReports("statTotalPL"), value: formatPL(totalPL), sub: tReports("subThisWeek"), color: totalPL >= 0 ? "var(--success)" : "var(--danger)" },
              { label: tReports("statAvgRR"), value: avgRR ? avgRR.toFixed(2) : "—", sub: tReports("subRiskToReward") },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <p className="stat-label">{s.label}</p>
                <p className="stat-value" style={s.color ? { color: s.color } : undefined}>{s.value}</p>
                <p className="stat-sub">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card">
              <p className="section-title">{tReports("checklistConsistency")}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", letterSpacing: "-0.03em" }}>{avgChecklist}</span>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}> {tReports("checklistAvgLabel", { avg: "" })}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(avgChecklist / 16) * 100}%`, background: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", borderRadius: 2 }} />
              </div>
            </div>

            <div className="card">
              <p className="section-title">{tReports("mentalStateOverview")}</p>
              {topMentalState ? (
                <div>
                  <p style={{ fontSize: 22, marginBottom: 6 }}>
                    {MENTAL_STATE_EMOJI[topMentalState[0]] ?? "😰"}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{topMentalState[0]}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{tReports("mostCommonState", { count: topMentalState[1] })}</p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{tReports("noMentalStateData")}</p>
              )}
            </div>
          </div>

          {/* Mistakes */}
          {mistakes.length > 0 && (
            <div className="card">
              <p className="section-title">{tReports("mistakesThisWeek")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mistakes.map((m, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: "var(--danger-muted)", border: "1px solid var(--danger)", borderRadius: 7, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trade list */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{tReports("tradesThisWeek")}</h2>
            </div>
            {trades.map((tr) => {
              const pl = tr.profitLoss ?? null;
              const isWin = pl !== null && pl > 0;
              const isLoss = pl !== null && pl < 0;
              return (
                <Link key={tr.id} href={`/trades/${tr.id}`} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: "1px solid var(--border-subtle)", textDecoration: "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{tr.pair}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(tr.entryTime).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge ${isWin ? "badge-win" : isLoss ? "badge-loss" : "badge-neutral"}`}>
                    {isWin ? t("common.win") : isLoss ? t("common.loss") : t("common.open")}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: isWin ? "var(--success)" : isLoss ? "var(--danger)" : "var(--text-muted)", minWidth: 60, textAlign: "right" }}>
                    {pl !== null ? formatPL(pl) : "—"}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
