import type { Trade, TradeChecklist } from "@prisma/client";

export function formatPL(value: number | null): string {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter(t => (t.profitLoss ?? 0) > 0).length;
  return Math.round((wins / trades.length) * 100);
}

export function getTotalPL(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);
}

export function getAvgRR(trades: Trade[]): number | null {
  const withRR = trades.filter(t => t.riskReward !== null);
  if (withRR.length === 0) return null;
  const total = withRR.reduce((sum, t) => sum + (t.riskReward ?? 0), 0);
  return total / withRR.length;
}

export function getAvgChecklistScore(trades: (Trade & { checklist: TradeChecklist | null })[]): number {
  const withChecklist = trades.filter(t => t.checklist);
  if (withChecklist.length === 0) return 0;
  const total = withChecklist.reduce((sum, t) => sum + (t.checklist?.score ?? 0), 0);
  return Math.round(total / withChecklist.length);
}

export function getOutcome(trade: Trade): "Win" | "Loss" | "Open" {
  const pl = trade.profitLoss;
  if (pl === null) return "Open";
  if (pl > 0) return "Win";
  return "Loss";
}