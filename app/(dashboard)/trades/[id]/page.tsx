import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Trade Detail" };

const CHECKLIST_LABELS: Record<string, string> = {
  supportRespected: "Support respected",
  resistanceRespected: "Resistance respected",
  trendlineRespected: "Trendline respected",
  orderBlockRespected: "Order block respected",
  confluence: "Confluence / Intersection",
  retestConfirmed: "Retest confirmed",
  rejectionCandle: "Rejection candle",
  liquiditySweep: "Liquidity sweep",
  msShift: "Market structure shift",
  htfAligned: "HTF aligned",
  londonSession: "London session",
  nySession: "NY session",
  avoidedLowVolume: "Avoided low volume",
  entryConfirmed: "Entry confirmation",
  riskManaged: "Risk managed",
  noImpulsiveEntry: "No impulsive entry",
};

const MENTAL_STATE_LABELS: Record<string, string> = {
  calm: "😌 Calm",
  focused: "🎯 Focused",
  tired: "😴 Tired",
  fearful: "😨 Fearful",
  overconfident: "😤 Overconfident",
  revenge: "😤 Revenge trading",
  emotional: "😰 Emotional",
  distracted: "🙃 Distracted",
};

function formatPL(value: number | null) {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value ?? "—"}</span>
    </div>
  );
}

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) return null;

  const { id } = await params;

  const trade = await prisma.trade.findFirst({
    where: { id, userId: user.id },
    include: { checklist: true, images: true },
  });

  if (!trade) notFound();

  const pl = trade.profitLoss ?? null;
  const isWin = pl !== null && pl > 0;
  const isLoss = pl !== null && pl < 0;

  const checklistEntries = trade.checklist
    ? Object.entries(CHECKLIST_LABELS).map(([key, label]) => ({
        key,
        label,
        checked: (trade.checklist as Record<string, any>)[key] === true,
      }))
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <Link href="/trades" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            ← Back to trades
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              {trade.pair}
            </h1>
            <span className={`badge ${isWin ? "badge-win" : isLoss ? "badge-loss" : "badge-neutral"}`} style={{ fontSize: 12 }}>
              {isWin ? "Win" : isLoss ? "Loss" : "Open"}
            </span>
            <span className={`badge ${trade.direction === "buy" ? "badge-accent" : "badge-neutral"}`} style={{ fontSize: 12 }}>
              {trade.direction === "buy" ? "📈 Buy" : "📉 Sell"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {new Date(trade.entryTime).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {trade.strategy ? ` · ${trade.strategy}` : ""}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: isWin ? "var(--success)" : isLoss ? "var(--danger)" : "var(--text-muted)", letterSpacing: "-0.03em" }}>
            {formatPL(pl)}
          </p>
          {trade.riskReward && (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>RR: {trade.riskReward}</p>
          )}
        </div>
      </div>

      {/* Screenshots */}
      {trade.images.length > 0 && (
        <div className="card">
          <p className="section-title">Screenshots</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {trade.images.map((img) => (
              <div key={img.id}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "capitalize" }}>
                  {img.imageType.replace(/_/g, " ")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt={img.imageType}
                  style={{ width: "100%", borderRadius: 7, border: "1px solid var(--border)", aspectRatio: "16/9", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Execution */}
        <div className="card">
          <p className="section-title" style={{ marginBottom: 0 }}>Execution</p>
          <InfoRow label="Entry Price" value={trade.entryPrice.toString()} />
          <InfoRow label="Exit Price" value={trade.exitPrice?.toString()} />
          <InfoRow label="Stop Loss" value={trade.stopLoss.toString()} />
          <InfoRow label="Take Profit" value={trade.takeProfit.toString()} />
          <InfoRow label="Position Size" value={trade.positionSize?.toString()} />
          <InfoRow label="Risk %" value={trade.riskPercent ? `${trade.riskPercent}%` : undefined} />
          <InfoRow label="Risk/Reward" value={trade.riskReward?.toString()} />
          <InfoRow label="Entry Time" value={new Date(trade.entryTime).toLocaleString()} />
          <InfoRow label="Exit Time" value={trade.exitTime ? new Date(trade.exitTime).toLocaleString() : undefined} />
          <InfoRow label="Entry TF" value={trade.entryTf} />
          <InfoRow label="Higher TF" value={trade.higherTf} />
        </div>

        {/* Checklist */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Strategy Checklist</p>
            {trade.checklist && (
              <span className={`badge ${trade.checklist.score >= 10 ? "badge-win" : trade.checklist.score >= 6 ? "badge-neutral" : "badge-loss"}`}>
                {trade.checklist.score} / 16
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {checklistEntries.map(({ key, label, checked }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: checked ? "var(--accent)" : "var(--bg-surface-2)",
                  border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {checked && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 12, color: checked ? "var(--text-primary)" : "var(--text-disabled)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Psychology */}
      <div className="card">
        <p className="section-title">Psychology</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Mental State</p>
            <span style={{ fontSize: 22 }}>
              {trade.mentalState ? MENTAL_STATE_LABELS[trade.mentalState] ?? trade.mentalState : "—"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { key: "followedPlan", label: "Followed plan" },
              { key: "movedSL", label: "Moved SL emotionally" },
              { key: "enteredEarly", label: "Entered early" },
              { key: "overtraded", label: "Overtraded" },
              { key: "mentalHealthOk", label: "Mental health was OK" },
            ].map(({ key, label }) => {
              const val = (trade as Record<string, unknown>)[key] as boolean | null;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{val === true ? "✅" : val === false ? "❌" : "—"}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      {(trade.setupNotes || trade.executionNotes || trade.mistakeNotes || trade.lessonsLearned) && (
        <div className="card">
          <p className="section-title">Notes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { key: "setupNotes", label: "Setup Explanation" },
              { key: "executionNotes", label: "Execution Notes" },
              { key: "mistakeNotes", label: "Mistakes Made" },
              { key: "lessonsLearned", label: "Lessons Learned" },
            ]
              .filter(({ key }) => (trade as Record<string, unknown>)[key])
              .map(({ key, label }) => (
                <div key={key}>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    {(trade as Record<string, unknown>)[key] as string}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
