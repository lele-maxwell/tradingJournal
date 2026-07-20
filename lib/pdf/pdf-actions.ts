"use server";

import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Trade } from "@prisma/client";

export type DateRange = "7d" | "30d" | "90d" | "all";

export interface TradeForPdf extends Trade {
  checklist: { score: number } | null;
}

export interface ReportData {
  trades: TradeForPdf[];
  stats: {
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPL: number;
    avgRR: number | null;
    avgChecklist: number;
  };
  dateRange: {
    start: Date | null;
    end: Date;
    label: string;
  };
}

function getDateRange(range: DateRange): { start: Date | null; end: Date } {
  const end = new Date();
  let start: Date | null = null;

  switch (range) {
    case "7d":
      start = new Date(end);
      start.setDate(end.getDate() - 7);
      break;
    case "30d":
      start = new Date(end);
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start = new Date(end);
      start.setDate(end.getDate() - 90);
      break;
    case "all":
      start = null;
      break;
  }

  return { start, end };
}

function getRangeLabel(range: DateRange): string {
  switch (range) {
    case "7d":
      return "Last 7 Days";
    case "30d":
      return "Last 30 Days";
    case "90d":
      return "Last 90 Days";
    case "all":
      return "All Time";
  }
}

export async function getReportData(range: DateRange): Promise<ReportData | null> {
  const user = await getUser();
  if (!user) return null;

  const { start, end } = getDateRange(range);

  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
      ...(start ? { entryTime: { gte: start, lte: end } } : {}),
    },
    include: { checklist: { select: { score: true } } },
    orderBy: { entryTime: "desc" },
  }) as TradeForPdf[];

  const total = trades.length;
  const wins = trades.filter(t => (t.profitLoss ?? 0) > 0).length;
  const losses = trades.filter(t => (t.profitLoss ?? 0) < 0).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const totalPL = trades.reduce((sum, t) => sum + (t.profitLoss ?? 0), 0);

  const tradesWithRR = trades.filter(t => t.riskReward !== null);
  const avgRR = tradesWithRR.length > 0
    ? tradesWithRR.reduce((sum, t) => sum + (t.riskReward ?? 0), 0) / tradesWithRR.length
    : null;

  const tradesWithChecklist = trades.filter(t => t.checklist);
  const avgChecklist = tradesWithChecklist.length > 0
    ? Math.round(tradesWithChecklist.reduce((sum, t) => sum + (t.checklist?.score ?? 0), 0) / tradesWithChecklist.length)
    : 0;

  return {
    trades,
    stats: {
      total,
      wins,
      losses,
      winRate,
      totalPL,
      avgRR,
      avgChecklist,
    },
    dateRange: {
      start,
      end,
      label: getRangeLabel(range),
    },
  };
}

export async function getTradeForPdf(tradeId: string): Promise<{ trade: Trade; checklist: unknown } | null> {
  const user = await getUser();
  if (!user) return null;

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId: user.id },
    include: {
      checklist: true,
      images: true,
    },
  });

  if (!trade) return null;

  return {
    trade,
    checklist: trade.checklist,
  };
}