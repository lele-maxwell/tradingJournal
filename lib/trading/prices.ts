/**
 * Mock price provider for the live ticker.
 *
 * Returns deterministic pseudo-random quotes seeded by symbol + current minute,
 * so reloads within the same minute give stable prices and different symbols
 * get different prices. A real provider (HTTP, websocket) can drop in later by
 * replacing the body of `fetchQuote` while keeping the interface.
 */
export interface Quote {
  symbol: string;
  price: number;
  /** ISO 8601 timestamp of the quote. */
  ts: string;
  /** Percent change from the previous minute's price (approximate). */
  changePct: number;
}

// Deterministic hash so each (symbol, minute) gives a stable pseudo-random number.
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Force into [0, 1).
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

const BASELINES: Record<string, number> = {
  "EUR/USD": 1.1, "GBP/USD": 1.27, "USD/JPY": 150, "AUD/USD": 0.66, "USD/CAD": 1.36,
  "XAU/USD": 2400, "XAG/USD": 28,
  "BTC/USD": 65000, "ETH/USD": 3500,
  "US30": 40000, "NAS100": 18500, "SPX500": 5400,
  "ES": 5400, "NQ": 18500, "CL": 78, "GC": 2400,
  "AAPL": 195, "MSFT": 420, "TSLA": 250,
};

export function fetchQuote(symbol: string, now: Date = new Date()): Quote {
  const minute = Math.floor(now.getTime() / 60_000);
  const seed = `${symbol}|${minute}`;
  const r = hash(seed);
  const prevR = hash(`${symbol}|${minute - 1}`);
  const baseline = BASELINES[symbol] ?? 100;
  // Drift within ±0.4% of the baseline.
  const drift = (r - 0.5) * 0.008;
  const prevDrift = (prevR - 0.5) * 0.008;
  const price = baseline * (1 + drift);
  const prevPrice = baseline * (1 + prevDrift);
  const changePct = ((price - prevPrice) / prevPrice) * 100;
  return {
    symbol,
    price: Math.round(price * 100) / 100,
    ts: now.toISOString(),
    changePct: Math.round(changePct * 1000) / 1000,
  };
}

export function fetchQuotes(symbols: string[], now: Date = new Date()): Quote[] {
  return symbols.map((s) => fetchQuote(s, now));
}
