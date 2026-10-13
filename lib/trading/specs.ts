/**
 * Built-in asset specifications.
 * contractSize = units per lot/contract/share/coin.
 * pipValuePerUnit = $ value of one price unit *one* (i.e. one pip for FX, one tick for indices/futures).
 * pipDecimal = number of decimal places that constitute one pip/tick (4 for FX, 2 for JPY/spot-metals, 1 for indices, etc).
 * unitLabel = the human label of the size unit shown in the UI.
 *
 * For CustomAsset entries created by a user, the values stored in DB override these.
 */
export type AssetCategory = "forex" | "index" | "futures" | "crypto" | "stock";

export type UnitLabel = "lot" | "contract" | "share" | "coin";

export interface AssetSpec {
  category: AssetCategory;
  contractSize: number;
  pipValuePerUnit: number;
  pipDecimal: number;
  unitLabel: UnitLabel;
}

export const BUILTIN_SPECS: Record<string, AssetSpec> = {
  // ── Forex ──
  "EUR/USD": { category: "forex", contractSize: 100_000, pipValuePerUnit: 0.0001, pipDecimal: 4, unitLabel: "lot" },
  "GBP/USD": { category: "forex", contractSize: 100_000, pipValuePerUnit: 0.0001, pipDecimal: 4, unitLabel: "lot" },
  "USD/JPY": { category: "forex", contractSize: 100_000, pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "lot" },
  "AUD/USD": { category: "forex", contractSize: 100_000, pipValuePerUnit: 0.0001, pipDecimal: 4, unitLabel: "lot" },
  "USD/CAD": { category: "forex", contractSize: 100_000, pipValuePerUnit: 0.0001, pipDecimal: 4, unitLabel: "lot" },
  // ── Spot metals / crypto ──
  "XAU/USD": { category: "forex", contractSize: 100,     pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "lot" },
  "XAG/USD": { category: "forex", contractSize: 5000,    pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "lot" },
  "BTC/USD": { category: "crypto", contractSize: 1,      pipValuePerUnit: 1,      pipDecimal: 2, unitLabel: "coin" },
  "ETH/USD": { category: "crypto", contractSize: 1,      pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "coin" },
  // ── Indexes (CFDs) ──
  "US30":    { category: "index", contractSize: 1,       pipValuePerUnit: 1,      pipDecimal: 1, unitLabel: "contract" },
  "NAS100":  { category: "index", contractSize: 1,       pipValuePerUnit: 1,      pipDecimal: 1, unitLabel: "contract" },
  "SPX500":  { category: "index", contractSize: 1,       pipValuePerUnit: 0.1,    pipDecimal: 2, unitLabel: "contract" },
  // ── Futures ──
  "ES":      { category: "futures", contractSize: 50,    pipValuePerUnit: 0.25,   pipDecimal: 2, unitLabel: "contract" },
  "NQ":      { category: "futures", contractSize: 20,    pipValuePerUnit: 0.25,   pipDecimal: 2, unitLabel: "contract" },
  "CL":      { category: "futures", contractSize: 1000,  pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "contract" },
  "GC":      { category: "futures", contractSize: 100,   pipValuePerUnit: 0.10,   pipDecimal: 2, unitLabel: "contract" },
  // ── Stocks ──
  "AAPL":    { category: "stock", contractSize: 1,       pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "share" },
  "MSFT":    { category: "stock", contractSize: 1,       pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "share" },
  "TSLA":    { category: "stock", contractSize: 1,       pipValuePerUnit: 0.01,   pipDecimal: 2, unitLabel: "share" },
};

export function listBuiltinsByCategory(category: AssetCategory): string[] {
  return Object.entries(BUILTIN_SPECS)
    .filter(([, s]) => s.category === category)
    .map(([k]) => k);
}

export function getBuiltinSpec(symbol: string): AssetSpec | undefined {
  return BUILTIN_SPECS[symbol];
}
