import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("trades");
  return { title: t("title") };
}

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

  const t = await getTranslations();
  const tTrades = await getTranslations("trades");

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
    ? trades.filter((tr) => {
        const pl = tr.profitLoss ?? 0;
        if (outcome === "win") return pl > 0;
        if (outcome === "loss") return pl < 0;
        if (outcome === "open") return tr.exitTime === null;
        return true;
      })
    : trades;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            {tTrades("title")}
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {tTrades("count", { count: filtered.length })}
          </p>
        </div>
        <Link href="/trades/new" className="btn btn-primary">
          {t("common.newTrade")}
        </Link>
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
          placeholder={tTrades("searchPlaceholder")}
          className="input"
          style={{ width: 220 }}
        />
        <select name="direction" defaultValue={direction} className="input" style={{ width: 140 }}>
          <option value="">{tTrades("allDirections")}</option>
          <option value="buy">{tTrades("buyLong")}</option>
          <option value="sell">{tTrades("sellShort")}</option>
        </select>
        <select name="outcome" defaultValue={outcome} className="input" style={{ width: 130 }}>
          <option value="">{tTrades("allOutcomes")}</option>
          <option value="win">{t("common.win")}</option>
          <option value="loss">{t("common.loss")}</option>
          <option value="open">{t("common.open")}</option>
        </select>
        <button type="submit" className="btn btn-secondary">{tTrades("filter")}</button>
        {(q || direction || outcome) && (
          <Link href="/trades" className="btn btn-ghost">{tTrades("clear")}</Link>
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
          {q || direction || outcome ? tTrades("noTradesMatch") : tTrades("noTradesYet")}
          {!q && !direction && !outcome && (
            <Link href="/trades/new" style={{ color: "var(--accent)", textDecoration: "none" }}>
              {tTrades("logFirstTrade")}
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
            <span>{tTrades("colTrade")}</span>
            <span>{tTrades("colDirection")}</span>
            <span>{tTrades("colOutcome")}</span>
            <span style={{ textAlign: "right" }}>{tTrades("colPL")}</span>
            <span style={{ textAlign: "right" }}>{tTrades("colRR")}</span>
            <span style={{ textAlign: "right" }}>{tTrades("colChecklist")}</span>
          </div>

          {filtered.map((tr) => {
            const pl = tr.profitLoss ?? null;
            const isWin = pl !== null && pl > 0;
            const isLoss = pl !== null && pl < 0;
            return (
              <Link
                key={tr.id}
                href={`/trades/${tr.id}`}
                className="trade-row"
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {tr.pair}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(tr.entryTime).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {tr.strategy ? ` · ${tr.strategy}` : ""}
                  </p>
                </div>
                <span className={`badge ${tr.direction === "buy" ? "badge-accent" : "badge-neutral"}`}>
                  {tr.direction === "buy" ? t("common.buy") : t("common.sell")}
                </span>
                <span className={`badge ${isWin ? "badge-win" : isLoss ? "badge-loss" : "badge-neutral"}`}>
                  {isWin ? t("common.win") : isLoss ? t("common.loss") : t("common.open")}
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
                  {tr.riskReward ? `${tr.riskReward}` : "—"}
                </span>
                <span style={{ textAlign: "right", fontSize: 13, color: "var(--text-secondary)" }}>
                  {tr.checklist?.score ?? 0}/16
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
