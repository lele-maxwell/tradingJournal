import type { Metadata } from "next";
import NewTradeForm from "@/components/trades/NewTradeForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("newTrade");
  return { title: t("title"), description: t("subtitle") };
}

export default async function NewTradePage() {
  const t = await getTranslations("newTrade");

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
          {t("title")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          {t("subtitle")}
        </p>
      </div>
      <NewTradeForm />
    </div>
  );
}
