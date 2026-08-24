import { NextResponse } from "next/server";
import { getPublicTape } from "@/lib/marlin/market";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const tape = await getPublicTape();
    return NextResponse.json({
      data: tape.quotes,
      equities: tape.equities,
      bonds: tape.bonds,
      meta: tape.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market feed unavailable";
    return NextResponse.json(
      {
        data: [],
        equities: [],
        bonds: [],
        meta: {
          broker_connected: false,
          source: "offline",
          exchange: "ESX",
          market: "MAINBOARD",
          error: message,
        },
      },
      { status: 200 },
    );
  }
}
