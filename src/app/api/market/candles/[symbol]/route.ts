import { NextResponse } from "next/server";
import { getCandles, getCandlesForWindow, getQuote } from "@/lib/marlin/market";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ symbol: string }> };

export async function GET(request: Request, { params }: Params) {
  const { symbol: raw } = await params;
  const symbol = String(raw || "").toUpperCase();
  if (!/^[A-Z0-9]{1,24}$/.test(symbol)) {
    return NextResponse.json({ message: "Symbol not found" }, { status: 404 });
  }

  const quote = await getQuote(symbol);
  if (!quote) {
    return NextResponse.json({ message: "Symbol not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const range = (url.searchParams.get("range") || "").toLowerCase().trim();
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const days = Math.max(1, Math.min(Number(url.searchParams.get("days") || 90), 2000));

  try {
    if (range || from) {
      const result = await getCandlesForWindow(
        symbol,
        range || "custom",
        from,
        to,
      );
      return NextResponse.json({
        data: result.candles,
        meta: { symbol, ...result.meta },
      });
    }

    return NextResponse.json({
      data: await getCandles(symbol, days),
      meta: { symbol, days },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load candles";
    return NextResponse.json({ message }, { status: 422 });
  }
}
