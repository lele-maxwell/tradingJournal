// Asset category configuration with pip/tick values
export const ASSET_CATEGORIES = {
  forex: {
    label: "Forex",
    pipValue: 0.0001, // 4 decimal places for most pairs
    pipValueJpy: 0.01, // 2 decimal places for JPY pairs
    contractSize: 100000, // 1 standard lot = 100,000 units
  },
  index: {
    label: "Indices",
    tickValue: 1, // varies by index
    pointValue: 0.1, // typical point value
    contractSize: 1, // 1 contract
  },
  futures: {
    label: "Futures",
    tickValue: 0.01, // varies by contract
    contractSize: 1, // varies by contract
  },
  crypto: {
    label: "Crypto",
    tickValue: 0.01, // varies heavily
    contractSize: 1,
  },
  stocks: {
    label: "Stocks",
    tickValue: 0.01, // $0.01 per share
    contractSize: 100, // 1 lot = 100 shares
  },
  custom: {
    label: "Custom",
    tickValue: 1,
    contractSize: 1,
  },
} as const;

export type AssetCategory = keyof typeof ASSET_CATEGORIES;

// Asset presets for quick selection
export const ASSET_PRESETS: Record<AssetCategory, string[]> = {
  forex: ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY"],
  index: ["US30", "US500", "US100", "GER30", "UK100", "FRA40", "AUS200", "JP225", "HK50"],
  futures: ["ES", "NQ", "CL", "GC", "SI", "ZB", "ZN", "ZF"],
  crypto: ["BTC/USD", "ETH/USD", "XRP/USD", "SOL/USD", "ADA/USD", "DOGE/USD"],
  stocks: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META"],
  custom: [],
};

// Calculate position size based on risk
export function calculatePositionSize(
  accountBalance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
  category: AssetCategory,
  isJpyPair: boolean = false
): { size: number; units: string; pipValue: number } {
  // Calculate risk amount
  const riskAmount = accountBalance * (riskPercent / 100);

  // Calculate stop distance in pips/ticks
  let stopDistance: number;
  let pipValue: number;

  if (category === "forex") {
    const config = ASSET_CATEGORIES.forex;
    pipValue = isJpyPair ? config.pipValueJpy : config.pipValue;
    stopDistance = Math.abs(entryPrice - stopLoss) / pipValue;
  } else if (category === "index") {
    const config = ASSET_CATEGORIES.index;
    pipValue = config.tickValue;
    stopDistance = Math.abs(entryPrice - stopLoss) / pipValue;
  } else if (category === "futures") {
    const config = ASSET_CATEGORIES.futures;
    pipValue = config.tickValue;
    stopDistance = Math.abs(entryPrice - stopLoss) / pipValue;
  } else if (category === "crypto") {
    const config = ASSET_CATEGORIES.crypto;
    pipValue = config.tickValue;
    stopDistance = Math.abs(entryPrice - stopLoss) / pipValue;
  } else {
    const config = ASSET_CATEGORIES.stocks;
    pipValue = config.tickValue;
    stopDistance = Math.abs(entryPrice - stopLoss) / pipValue;
  }

  // Calculate lot size
  let lotSize: number;
  let units: string;

  if (category === "forex") {
    // For forex: pip value per lot
    const pipValuePerLot = 10; // $10 per pip for 1 standard lot
    lotSize = riskAmount / (stopDistance * pipValuePerLot);
    units = "lots";
  } else if (category === "stocks") {
    // For stocks: 1 lot = 100 shares
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const shares = riskAmount / riskPerShare;
    lotSize = shares / 100; // convert to lots
    units = "lots (100 shares)";
  } else {
    // For indices/futures/crypto: simpler calculation
    const pointValuePerContract = pipValue;
    lotSize = riskAmount / (stopDistance * pointValuePerContract);
    units = "contracts";
  }

  return { size: Math.max(0.01, lotSize), units, pipValue };
}

// Calculate risk/reward ratio
export function calculateRR(
  direction: "buy" | "sell",
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number | null {
  if (!entryPrice || !stopLoss || !takeProfit || isNaN(entryPrice) || isNaN(stopLoss) || isNaN(takeProfit)) {
    return null;
  }

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);

  if (risk === 0) return null;

  return reward / risk;
}

// Calculate estimated P/L
export function calculateEstimatedPL(
  direction: "buy" | "sell",
  entryPrice: number,
  exitPrice: number,
  positionSize: number,
  category: AssetCategory,
  accountBalance?: number
): { pl: number; percentage: number | null; isProfit: boolean } {
  const priceDiff = direction === "buy"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  let pl: number;
  const config = ASSET_CATEGORIES[category];

  if (category === "forex") {
    // For forex: approximate P/L based on lot size
    // 1 pip = $10 for standard lot on most pairs
    const pips = Math.abs(priceDiff) / 0.0001;
    pl = priceDiff > 0
      ? pips * positionSize * 10
      : -pips * positionSize * 10;
  } else if (category === "stocks") {
    // For stocks: shares = lots * 100
    pl = priceDiff * (positionSize * 100);
  } else {
    // For others: simple calculation
    pl = priceDiff * positionSize;
  }

  const percentage = accountBalance && accountBalance > 0
    ? (pl / accountBalance) * 100
    : null;

  return {
    pl,
    percentage,
    isProfit: pl > 0,
  };
}

// Check if pair is JPY-based
export function isJpyPair(pair: string): boolean {
  return pair.toUpperCase().includes("JPY");
}