import { NextResponse } from "next/server";
import { getReportData } from "@/lib/pdf/pdf-actions";
import type { DateRange } from "@/lib/pdf/pdf-actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") as DateRange) || "30d";

  // Validate range
  if (!["7d", "30d", "90d", "all"].includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const data = await getReportData(range);

  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(data);
}