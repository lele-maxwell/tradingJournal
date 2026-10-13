import { NextRequest, NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/trading/prices";

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }
  const quotes = fetchQuotes(symbols);
  return NextResponse.json({ quotes, ts: new Date().toISOString() });
}
