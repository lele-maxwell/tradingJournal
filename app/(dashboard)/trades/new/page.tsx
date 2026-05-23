import type { Metadata } from "next";
import NewTradeForm from "@/components/trades/NewTradeForm";

export const metadata: Metadata = {
  title: "New Trade",
  description: "Log a new trade in MaxStrat",
};

export default function NewTradePage() {
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
      <NewTradeForm />
    </div>
  );
}
