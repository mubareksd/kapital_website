import { NextResponse } from "next/server";
import { loadTickerSnapshot } from "@/lib/marlin/market";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const snapshot = await loadTickerSnapshot({ maxWaitMs: 12_000 });
  return NextResponse.json(snapshot);
}
