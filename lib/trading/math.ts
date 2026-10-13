/**
 * Pure trading-math helpers. No React, no I/O. Used by both the
 * new-trade form (live preview) and unit tests.
 */
import type { AssetSpec } from "./specs";

export type Direction = "buy" | "sell";

export interface RecommendedLotInput {
  /** Account balance in base currency. */
  balance: number;
  /** Risk as percent of balance, e.g. 1 for 1%. */
  riskPct: number;
  /** Entry price. */
  entry: number;
  /** Stop-loss price. */
  sl: number;
  /** Spec for the asset (built-in or custom). */
  spec: AssetSpec;
  /** Optional override for contract size (CustomAsset). */
  contractSizeOverride?: number;
}

export interface PositionSizeResult {
  /** Number of lots/contracts/shares/coins. */
  size: number;
  /** Distance in pips/ticks between entry and SL. */
  slPips: number;
  /** Dollar value of the risk on this trade. */
  riskDollars: number;
  /** Dollar value of one full pip/tick movement of the computed size. */
  pipValueDollars: number;
  /** Whether inputs were valid; if false, size is 0. */
  valid: boolean;
}

export function stopDistancePips(spec: AssetSpec, entry: number, sl: number): number {
  const diff = Math.abs(entry - sl);
  if (diff <= 0 || spec.pipValuePerUnit <= 0) return 0;
  return diff / spec.pipValuePerUnit;
}

export function recommendedLotSize(input: RecommendedLotInput): PositionSizeResult {
  const { balance, riskPct, entry, sl, spec, contractSizeOverride } = input;
  const invalid = !Number.isFinite(balance) || !Number.isFinite(riskPct) ||
                  !Number.isFinite(entry) || !Number.isFinite(sl) ||
                  balance <= 0 || riskPct <= 0 || riskPct > 100;
  if (invalid) {
    return { size: 0, slPips: 0, riskDollars: 0, pipValueDollars: 0, valid: false };
  }
  const contractSize = contractSizeOverride && contractSizeOverride > 0
    ? contractSizeOverride
    : spec.contractSize;
  const slPips = stopDistancePips(spec, entry, sl);
  if (slPips <= 0) {
    return { size: 0, slPips: 0, riskDollars: 0, pipValueDollars: 0, valid: false };
  }
  const riskDollars = (balance * riskPct) / 100;
  // $ per pip (or tick) for ONE lot/contract/share.
  // For FX: contractSize (units) * pipValue (in quote terms) but for USD-quoted pairs it's already $ per pip per lot.
  // To keep it generic we model: $ per pip for 1 lot = contractSize * pipValuePerUnit (interpreted as $ per unit move),
  // where pipValuePerUnit is the *quote currency per base currency* of one pip. For USD-quoted pairs this equals $ directly.
  const pipValueDollarsPerLot = contractSize * spec.pipValuePerUnit;
  // size in lots such that riskDollars = slPips * size * pipValuePerLot
  const size = riskDollars / (slPips * pipValueDollarsPerLot);
  const pipValueDollars = size * pipValueDollarsPerLot;
  return {
    size: Math.round(size * 100) / 100,
    slPips: Math.round(slPips * 100) / 100,
    riskDollars: Math.round(riskDollars * 100) / 100,
    pipValueDollars: Math.round(pipValueDollars * 100) / 100,
    valid: true,
  };
}

export interface CalcPLInput {
  direction: Direction;
  entry: number;
  /** Take-profit for unrealised, exit-price for realised. */
  exit: number;
  /** Position size in lots/contracts/shares. */
  size: number;
  spec: AssetSpec;
  contractSizeOverride?: number;
}

export function calcPL(input: CalcPLInput): number {
  const { direction, entry, exit, size, spec, contractSizeOverride } = input;
  if (!Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(size)) return 0;
  if (size <= 0) return 0;
  const contractSize = contractSizeOverride && contractSizeOverride > 0
    ? contractSizeOverride
    : spec.contractSize;
  const priceDiff = direction === "buy" ? exit - entry : entry - exit;
  // pips = priceDiff / pipValuePerUnit. $ value = pips * size * contractSize * pipValuePerUnit.
  // Note: pipValuePerUnit represents the *price* of one pip/tick (not $), so we multiply
  // through by contractSize * pipValuePerUnit to get $ per pip per lot.
  const pips = priceDiff / spec.pipValuePerUnit;
  const dollarsPerPipPerLot = contractSize * spec.pipValuePerUnit;
  const pl = pips * size * dollarsPerPipPerLot;
  return Math.round(pl * 100) / 100;
}

/** Convert a list of pips into expected dollar P/L given size. */
export function plFromPips(spec: AssetSpec, pips: number, size: number, contractSizeOverride?: number): number {
  if (!Number.isFinite(pips) || !Number.isFinite(size)) return 0;
  const contractSize = contractSizeOverride && contractSizeOverride > 0 ? contractSizeOverride : spec.contractSize;
  return Math.round(pips * size * contractSize * spec.pipValuePerUnit * 100) / 100;
}
