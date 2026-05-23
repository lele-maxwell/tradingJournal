import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Weekly Report" };

function formatPL(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export default async function WeeklyReportPage() {
  const user = await getUser();
  if (!user) return null;

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
  const wins = trades.filter((t) => (t.profitLoss ?? 0) > 0).length;
  const losses = trades.filter((t) => (t.profitLoss ?? 0) < 0).length;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const totalPL = trades.reduce((s, t) => s + (t.profitLoss ?? 0), 0);
  const avgRR = total ? trades.reduce((s, t) => s + (t.riskReward ?? 0), 0) / total : 0;
  const avgChecklist = total
    ? Math.round(trades.reduce((s, t) => s + (t.checklist?.score ?? 0), 0) / total)
    : 0;

  // Mental state overview
  const mentalCounts: Record<string, number> = {};
  trades.forEach((t) => {
    if (t.mentalState) mentalCounts[t.mentalState] = (mentalCounts[t.mentalState] ?? 0) + 1;
  });
  const topMentalState = Object.entries(mentalCounts).sort((a, b) => b[1] - a[1])[0];

  // Most common mistake
  const mistakes = trades.filter((t) => t.mistakeNotes).map((t) => t.mistakeNotes!);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Weekly Report
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} —{" "}
            {weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <Link href="/reports/monthly" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
          Monthly report →
        </Link>
      </div>

      {total === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontSize: 14 }}>
          No trades this week.{" "}
          <Link href="/trades/new" style={{ color: "var(--accent)", textDecoration: "none" }}>Log a trade →</Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { label: "Total Trades", value: String(total), sub: `${wins}W / ${losses}L` },
              { label: "Win Rate", value: `${winRate}%`, sub: "this week", color: winRate >= 60 ? "var(--success)" : winRate >= 40 ? "var(--warning)" : "var(--danger)" },
              { label: "Total P/L", value: formatPL(totalPL), sub: "this week", color: totalPL >= 0 ? "var(--success)" : "var(--danger)" },
              { label: "Avg RR", value: avgRR ? avgRR.toFixed(2) : "—", sub: "risk-to-reward" },
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
              <p className="section-title">Checklist Consistency</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", letterSpacing: "-0.03em" }}>{avgChecklist}</span>
                <span style={{ fontSize: 14, color: "var(--text-muted)" }}> / 16 avg</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(avgChecklist / 16) * 100}%`, background: avgChecklist >= 10 ? "var(--success)" : avgChecklist >= 6 ? "var(--warning)" : "var(--danger)", borderRadius: 2 }} />
              </div>
            </div>

            <div className="card">
              <p className="section-title">Mental State Overview</p>
              {topMentalState ? (
                <div>
                  <p style={{ fontSize: 22, marginBottom: 6 }}>
                    {topMentalState[0] === "calm" ? "😌" : topMentalState[0] === "focused" ? "🎯" : topMentalState[0] === "fearful" ? "😨" : topMentalState[0] === "tired" ? "😴" : topMentalState[0] === "overconfident" ? "😤" : "😰"}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{topMentalState[0]}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Most common state · {topMentalState[1]} trade{topMentalState[1] !== 1 ? "s" : ""}</p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No mental state data</p>
              )}
            </div>
          </div>

          {/* Mistakes */}
          {mistakes.length > 0 && (
            <div className="card">
              <p className="section-title">Mistakes This Week</p>
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
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Trades This Week</h2>
            </div>
            {trades.map((t) => {
              const pl = t.profitLoss ?? null;
              const isWin = pl !== null && pl > 0;
              const isLoss = pl !== null && pl < 0;
              return (
                <Link key={t.id} href={`/trades/${t.id}`} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: "1px solid var(--border-subtle)", textDecoration: "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t.pair}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(t.entryTime).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge ${isWin ? "badge-win" : isLoss ? "badge-loss" : "badge-neutral"}`}>
                    {isWin ? "Win" : isLoss ? "Loss" : "Open"}
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
