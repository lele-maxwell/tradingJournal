import { describe, it, expect } from "vitest";
import { calcRR } from "@/lib/validations/trade.schema";
import { recommendedLotSize, calcPL, plFromPips, stopDistancePips } from "@/lib/trading/math";
import { BUILTIN_SPECS, getBuiltinSpec } from "@/lib/trading/specs";
import { fetchQuote, fetchQuotes } from "@/lib/trading/prices";

describe("calcRR", () => {
  it("computes RR for buy", () => {
    expect(calcRR("buy", 1.1, 1.095, 1.11)).toBe(2); // 100 pips risk, 200 reward
  });
  it("computes RR for sell", () => {
    expect(calcRR("sell", 1.1, 1.105, 1.09)).toBe(2); // 50 pips risk, 100 reward
  });
  it("returns null when inputs are zero", () => {
    expect(calcRR("buy", 0, 0, 0)).toBeNull();
  });
  it("returns null when risk is non-positive", () => {
    expect(calcRR("buy", 1.1, 1.1, 1.2)).toBeNull();
  });
});

describe("stopDistancePips", () => {
  it("computes pips for FX (4-decimal)", () => {
    expect(stopDistancePips(BUILTIN_SPECS["EUR/USD"], 1.1, 1.095)).toBeCloseTo(50);
  });
  it("computes pips for JPY (2-decimal)", () => {
    expect(stopDistancePips(BUILTIN_SPECS["USD/JPY"], 150, 149.5)).toBeCloseTo(50);
  });
  it("computes ticks for indices (1-decimal)", () => {
    expect(stopDistancePips(BUILTIN_SPECS["US30"], 40000, 39900)).toBeCloseTo(100);
  });
});

describe("recommendedLotSize", () => {
  it("computes correct lot size for EUR/USD 1% risk 50 pips", () => {
    // balance 10000, risk 1% = $100 risk; 50 pip SL on EUR/USD lot=$10/pip ⇒ 0.2 lots.
    const r = recommendedLotSize({
      balance: 10000, riskPct: 1, entry: 1.1, sl: 1.095, spec: BUILTIN_SPECS["EUR/USD"],
    });
    expect(r.valid).toBe(true);
    expect(r.slPips).toBeCloseTo(50);
    expect(r.riskDollars).toBe(100);
    expect(r.size).toBeCloseTo(0.2);
  });

  it("handles custom contract size override", () => {
    // Smaller contract (1/10 of standard) ⇒ 10x larger lot count for the same risk.
    const r = recommendedLotSize({
      balance: 10000, riskPct: 1, entry: 1.1, sl: 1.095,
      spec: BUILTIN_SPECS["EUR/USD"], contractSizeOverride: 10_000,
    });
    expect(r.valid).toBe(true);
    expect(r.size).toBeCloseTo(2); // 10× smaller contract ⇒ 10× larger size
  });

  it("returns invalid for zero balance", () => {
    expect(recommendedLotSize({ balance: 0, riskPct: 1, entry: 1.1, sl: 1.095, spec: BUILTIN_SPECS["EUR/USD"] }).valid).toBe(false);
  });
  it("returns invalid for negative risk", () => {
    expect(recommendedLotSize({ balance: 10000, riskPct: -1, entry: 1.1, sl: 1.095, spec: BUILTIN_SPECS["EUR/USD"] }).valid).toBe(false);
  });
  it("returns invalid for risk > 100", () => {
    expect(recommendedLotSize({ balance: 10000, riskPct: 150, entry: 1.1, sl: 1.095, spec: BUILTIN_SPECS["EUR/USD"] }).valid).toBe(false);
  });
  it("returns invalid when entry == sl", () => {
    expect(recommendedLotSize({ balance: 10000, riskPct: 1, entry: 1.1, sl: 1.1, spec: BUILTIN_SPECS["EUR/USD"] }).valid).toBe(false);
  });
});

describe("calcPL", () => {
  it("computes profit for a winning buy on EUR/USD", () => {
    // 1 lot EUR/USD, entry 1.1, TP 1.105 ⇒ 50 pips ⇒ $500
    expect(calcPL({
      direction: "buy", entry: 1.1, exit: 1.105, size: 1, spec: BUILTIN_SPECS["EUR/USD"],
    })).toBe(500);
  });
  it("computes loss for a losing sell on EUR/USD", () => {
    // 1 lot, entry 1.1, exit 1.11 ⇒ loss of 100 pips ⇒ -$1000
    expect(calcPL({
      direction: "sell", entry: 1.1, exit: 1.11, size: 1, spec: BUILTIN_SPECS["EUR/USD"],
    })).toBe(-1000);
  });
  it("returns 0 for size 0", () => {
    expect(calcPL({
      direction: "buy", entry: 1.1, exit: 1.2, size: 0, spec: BUILTIN_SPECS["EUR/USD"],
    })).toBe(0);
  });
  it("applies contract size override", () => {
    expect(calcPL({
      direction: "buy", entry: 100, exit: 101, size: 1,
      spec: BUILTIN_SPECS["AAPL"], contractSizeOverride: 10,
    })).toBe(10);
  });
});

describe("plFromPips", () => {
  it("computes pips-to-dollars correctly", () => {
    expect(plFromPips(BUILTIN_SPECS["EUR/USD"], 50, 1)).toBe(500);
  });
});

describe("spec catalog", () => {
  it("contains at least 5 forex symbols", () => {
    expect(Object.values(BUILTIN_SPECS).filter((s) => s.category === "forex").length).toBeGreaterThanOrEqual(5);
  });
  it("contains at least one example for each category", () => {
    expect(!!getBuiltinSpec("EUR/USD")).toBe(true);
    expect(!!getBuiltinSpec("US30")).toBe(true);
    expect(!!getBuiltinSpec("ES")).toBe(true);
    expect(!!getBuiltinSpec("BTC/USD")).toBe(true);
    expect(!!getBuiltinSpec("AAPL")).toBe(true);
  });
});

describe("fetchQuote (mock provider)", () => {
  it("returns a positive price for a known symbol", () => {
    const q = fetchQuote("EUR/USD");
    expect(q.symbol).toBe("EUR/USD");
    expect(q.price).toBeGreaterThan(0);
    expect(typeof q.ts).toBe("string");
    expect(Number.isFinite(q.changePct)).toBe(true);
  });
  it("is deterministic within the same minute", () => {
    const t = new Date("2025-01-01T12:00:30Z");
    expect(fetchQuote("BTC/USD", t)).toEqual(fetchQuote("BTC/USD", t));
  });
  it("returns many quotes for many symbols", () => {
    const quotes = fetchQuotes(["EUR/USD", "BTC/USD", "US30"]);
    expect(quotes).toHaveLength(3);
    expect(new Set(quotes.map((q) => q.symbol)).size).toBe(3);
  });
});
