import { z } from "zod";

export const tradeSchema = z.object({
  // General
  pair: z.string().min(1, "errors.pairRequired"),
  direction: z.enum(["buy", "sell"], { message: "errors.directionInvalid" }),
  strategy: z.string().optional(),

  // Entry & Exit
  entryPrice: z.coerce.number({ message: "errors.entryPriceRequired" }).positive("errors.mustBePositive"),
  exitPrice: z.coerce.number().positive("errors.mustBePositive").optional().or(z.literal("")),
  stopLoss: z.coerce.number({ message: "errors.stopLossRequired" }).positive("errors.mustBePositive"),
  takeProfit: z.coerce.number({ message: "errors.takeProfitRequired" }).positive("errors.mustBePositive"),

  // Risk
  positionSize: z.coerce.number().nonnegative("errors.mustBeNonNegative").optional().or(z.literal("")),
  riskPercent: z.coerce.number().nonnegative("errors.mustBeNonNegative").max(100, "errors.riskPercentMax").optional().or(z.literal("")),

  // Timing
  entryTime: z.string().min(1, "errors.entryTimeRequired"),
  exitTime: z.string().optional(),
  entryTf: z.string().optional(),
  higherTf: z.string().optional(),

  // Notes
  setupNotes: z.string().optional(),
  executionNotes: z.string().optional(),
  mistakeNotes: z.string().optional(),
  lessonsLearned: z.string().optional(),

  // Psychology
  mentalState: z.string().optional(),
  followedPlan: z.boolean().optional(),
  movedSL: z.boolean().optional(),
  enteredEarly: z.boolean().optional(),
  overtraded: z.boolean().optional(),
  mentalHealthOk: z.boolean().optional(),

  // Checklist
  supportRespected: z.boolean().default(false),
  resistanceRespected: z.boolean().default(false),
  trendlineRespected: z.boolean().default(false),
  orderBlockRespected: z.boolean().default(false),
  confluence: z.boolean().default(false),
  retestConfirmed: z.boolean().default(false),
  rejectionCandle: z.boolean().default(false),
  liquiditySweep: z.boolean().default(false),
  msShift: z.boolean().default(false),
  htfAligned: z.boolean().default(false),
  londonSession: z.boolean().default(false),
  nySession: z.boolean().default(false),
  avoidedLowVolume: z.boolean().default(false),
  entryConfirmed: z.boolean().default(false),
  riskManaged: z.boolean().default(false),
  noImpulsiveEntry: z.boolean().default(false),
});

export type TradeFormData = z.infer<typeof tradeSchema>;

// All 16 checklist fields
export const CHECKLIST_FIELDS = [
  "supportRespected",
  "resistanceRespected",
  "trendlineRespected",
  "orderBlockRespected",
  "confluence",
  "retestConfirmed",
  "rejectionCandle",
  "liquiditySweep",
  "msShift",
  "htfAligned",
  "londonSession",
  "nySession",
  "avoidedLowVolume",
  "entryConfirmed",
  "riskManaged",
  "noImpulsiveEntry",
] as const;

export function calcChecklistScore(data: Partial<TradeFormData>): number {
  return CHECKLIST_FIELDS.filter((f) => data[f] === true).length;
}

export function calcRR(
  direction: "buy" | "sell",
  entry: number,
  sl: number,
  tp: number
): number | null {
  if (!entry || !sl || !tp) return null;
  if (direction === "buy") {
    const risk = entry - sl;
    const reward = tp - entry;
    if (risk <= 0) return null;
    return Math.round((reward / risk) * 100) / 100;
  } else {
    const risk = sl - entry;
    const reward = entry - tp;
    if (risk <= 0) return null;
    return Math.round((reward / risk) * 100) / 100;
  }
}
