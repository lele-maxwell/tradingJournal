import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import NewTradeForm from "@/components/trades/NewTradeForm";

export const metadata: Metadata = {
  title: "New Trade",
  description: "Log a new trade in MaxStrat",
};

export default async function NewTradePage() {
  const user = await getUser();
  if (!user) return null;

  const [profile, customAssets] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.customAsset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, symbol: true, category: true, contractSize: true, pipValue: true },
    }),
  ]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          New Trade
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Validate your setup, record your execution, and track your psychology.
        </p>
      </div>
      <NewTradeForm
        initialBalance={profile?.accountBalance ?? 0}
        initialRiskPct={profile?.defaultRiskPct ?? 1}
        initialCustomAssets={customAssets.map((a) => ({
          id: a.id,
          symbol: a.symbol,
          category: a.category as never,
          contractSize: a.contractSize,
          pipValue: a.pipValue,
        }))}
      />
    </div>
  );
}
