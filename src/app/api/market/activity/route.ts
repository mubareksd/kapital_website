import { NextResponse } from "next/server";
import {
  emptyMarketActivity,
  loadMarketActivity,
  peekMarketActivity,
} from "@/lib/marlin/activity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const cached = peekMarketActivity();
    const activity = await loadMarketActivity({
      maxWaitMs: cached?.ready ? 200 : 8_000,
    });
    return NextResponse.json(activity ?? emptyMarketActivity());
  } catch {
    return NextResponse.json(emptyMarketActivity(), { status: 200 });
  }
}
