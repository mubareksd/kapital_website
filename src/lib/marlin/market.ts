import { marlinConnected, marlinGetJson } from "./client";
import { asList } from "./payload";
import { filterCandlesByWindow, resolveChartRange } from "./chart-range";
import type { Candle, MarketStatus, PublicQuote, Quote, TickerSnapshot } from "./types";

type CacheEntry<T> = { value: T; expiresAt: number };

const watchlistCache: { entry: CacheEntry<Quote[]> | null; error: string | null } = {
  entry: null,
  error: null,
};
const candleCache = new Map<string, CacheEntry<Candle[]>>();
const emsCache = new Map<string, number>();

function cacheTtlMs(): number {
  const raw = Number(process.env.MARLIN_CACHE_TTL_MS ?? "20000");
  return Number.isFinite(raw) && raw > 0 ? raw : 20_000;
}

function firstNumeric(map: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = map[key];
    if (value === null || value === undefined || value === "") continue;
    if (typeof value !== "number" && typeof value !== "string") continue;
    const n = Number(value);
    if (!Number.isFinite(n)) continue;
    return n;
  }
  return null;
}

function firstPositiveNumeric(map: Record<string, unknown>, keys: string[]): number | null {
  const n = firstNumeric(map, keys);
  return n !== null && n > 0 ? n : null;
}

function statsMap(stats: unknown): Record<string, unknown> {
  if (Array.isArray(stats)) {
    const first = stats[0];
    return first && typeof first === "object" ? (first as Record<string, unknown>) : {};
  }
  return stats && typeof stats === "object" ? (stats as Record<string, unknown>) : {};
}

function assetCode(row: Record<string, unknown>): string | null {
  const nested = row.assetClass;
  if (nested && typeof nested === "object") {
    const code = (nested as Record<string, unknown>).assetCode ?? (nested as Record<string, unknown>).code;
    if (typeof code === "string" && code) return code;
  }
  if (typeof nested === "string" && nested) return nested;
  const code = row.assetCode;
  return typeof code === "string" && code ? code : null;
}

function looksLikeStats(row: Record<string, unknown>): boolean {
  return (
    "lastTradePrice" in row ||
    "lastDayClosePrice" in row ||
    "bestBidPrice" in row
  );
}

function fmtPrice(value: number): string {
  const digits = value > 0 && value < 0.01 ? 4 : 2;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function mapQuotes(
  rows: unknown,
  assetClass: string | null = null,
  source = "live",
): Quote[] {
  const quotes: Quote[] = [];

  for (const rowRaw of asList(rows)) {
    if (!rowRaw || typeof rowRaw !== "object") continue;
    const row = rowRaw as Record<string, unknown>;
    let stats = statsMap(row.securityStatsDTO);
    if (Object.keys(stats).length === 0 && looksLikeStats(row)) {
      stats = row;
    }

    const symbol = String(
      row.symbolCode ??
        row.symbol ??
        row.securityCode ??
        stats.symbolCode ??
        stats.symbol ??
        stats.securityCode ??
        "",
    ).toUpperCase();
    if (!symbol) continue;

    const bbo = statsMap(row.bestMarketDTO ?? stats.bestMarket);
    const bid =
      firstPositiveNumeric(bbo, ["bidPrice", "bid"]) ??
      firstPositiveNumeric(stats, ["bestBidPrice", "bid"]) ??
      0;
    const ask =
      firstPositiveNumeric(bbo, ["offerPrice", "askPrice", "ask"]) ??
      firstPositiveNumeric(stats, ["bestAskPrice", "ask"]) ??
      0;

    const trade =
      firstPositiveNumeric(stats, ["lastTradePrice", "currentPrice", "last", "ltp"]) ?? 0;
    const close =
      firstPositiveNumeric(stats, ["lastDayClosePrice", "previousClose", "open"]) ?? 0;
    let last =
      trade ||
      firstPositiveNumeric(stats, ["average", "high", "dayHigh"]) ||
      close ||
      0;
    if (last <= 0) {
      if (bid > 0 && ask > 0) last = (bid + ask) / 2;
      else if (bid > 0) last = bid;
      else if (ask > 0) last = ask;
    }

    let changePct = firstNumeric(stats, [
      "changePerc",
      "percentChange",
      "changePct",
      "changePercent",
      "pctChange",
      "percentageChange",
    ]);
    if (
      (changePct === null || Math.abs(changePct) < 0.0005) &&
      close > 0 &&
      trade > 0 &&
      Math.abs(trade - close) >= 0.0005
    ) {
      changePct = ((trade - close) / close) * 100;
    }
    if (changePct === null) {
      const net = firstNumeric(stats, ["change", "netChange", "priceChange"]);
      if (net !== null && close > 0) changePct = (net / close) * 100;
    }

    let securityId = row.securityId ?? stats.securityId ?? null;
    let emsId =
      row.exchangeMarketSecurityId ??
      stats.exchangeMarketSecurityId ??
      emsCache.get(symbol) ??
      null;
    if (emsId !== null && emsId !== "") emsId = Number(emsId);
    if (securityId !== null && securityId !== "") securityId = Number(securityId);

    const exchange =
      (typeof row.exchangeCode === "string" && row.exchangeCode) ||
      (row.exchange && typeof row.exchange === "object"
        ? String((row.exchange as Record<string, unknown>).exchangeCode ?? "ESX")
        : null) ||
      (typeof stats.exchangeCode === "string" ? stats.exchangeCode : "ESX");

    quotes.push({
      symbol,
      name: String(
        row.securityName ??
          row.securityDescription ??
          stats.securityDescription ??
          row.name ??
          symbol,
      ),
      last,
      change_pct: Math.round(((changePct ?? 0) + Number.EPSILON) * 10000) / 10000,
      volume:
        firstNumeric(stats, [
          "totalTradedQuantity",
          "tradedVolume",
          "volume",
          "vol",
          "lastTradeQuantity",
        ]) ?? 0,
      bid,
      ask,
      high: firstPositiveNumeric(stats, ["high", "dayHigh"]) ?? 0,
      low: firstPositiveNumeric(stats, ["low", "dayLow"]) ?? 0,
      exchange,
      market: String(row.marketCode ?? row.market ?? stats.marketCode ?? "MAINBOARD"),
      asset_class: String(assetCode(row) ?? assetClass ?? "").toUpperCase(),
      exchange_market_security_id:
        typeof emsId === "number" && Number.isFinite(emsId) ? emsId : null,
      security_id:
        typeof securityId === "number" && Number.isFinite(securityId)
          ? securityId
          : null,
      source,
    });
  }

  return quotes;
}

async function fetchLiveWatchlist(): Promise<Quote[]> {
  const quotes: Record<string, Quote> = {};
  const classes = asList(await marlinGetJson("/asset-class/"));

  for (const classRaw of classes) {
    if (!classRaw || typeof classRaw !== "object") continue;
    const klass = classRaw as Record<string, unknown>;
    const assetId = klass.assetId ?? klass.id;
    if (assetId === null || assetId === undefined) continue;
    const rows = await marlinGetJson(`/securities/allSecuritiesWStats/assetClass/${assetId}`);
    for (const quote of mapQuotes(rows, assetCode(klass), "live")) {
      quotes[quote.symbol] = quote;
    }
  }

  if (Object.keys(quotes).length === 0) {
    const catalog = await marlinGetJson("/securities/");
    for (const quote of mapQuotes(catalog, null, "live")) {
      quotes[quote.symbol] = quote;
    }
  }

  if (Object.keys(quotes).length === 0) {
    const stats = await marlinGetJson("/security/symbol/stats-all/exch/ESX");
    for (const quote of mapQuotes(stats, null, "live")) {
      quotes[quote.symbol] = quote;
    }
  }

  return Object.values(quotes);
}

export async function getWatchlist(): Promise<Quote[]> {
  const ttl = cacheTtlMs();
  if (watchlistCache.entry && watchlistCache.entry.expiresAt > Date.now()) {
    return watchlistCache.entry.value;
  }

  try {
    const quotes = await fetchLiveWatchlist();
    watchlistCache.entry = { value: quotes, expiresAt: Date.now() + ttl };
    watchlistCache.error = null;
    return quotes;
  } catch (error) {
    watchlistCache.error =
      error instanceof Error ? error.message : "Market feed unavailable";
    return watchlistCache.entry?.value ?? [];
  }
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const code = symbol.toUpperCase();
  return (await getWatchlist()).find((q) => q.symbol === code) ?? null;
}

export function publicAssetKind(symbol: string, assetClass = ""): "equity" | "bond" {
  const s = symbol.toUpperCase();
  const c = assetClass.toUpperCase();
  if (c.includes("BOND") || c.includes("BILL") || s.startsWith("TBL")) {
    return "bond";
  }
  return "equity";
}

export async function getMarketStatus(): Promise<MarketStatus> {
  const live = await marlinConnected();
  return {
    broker_connected: live,
    source: live ? "live" : "offline",
    exchange: "ESX",
    market: "MAINBOARD",
    error: live ? null : watchlistCache.error,
  };
}

export async function getPublicTape(): Promise<{
  quotes: PublicQuote[];
  equities: PublicQuote[];
  bonds: PublicQuote[];
  status: MarketStatus;
}> {
  const quotes = await getWatchlist();
  quotes.sort((a, b) => a.symbol.localeCompare(b.symbol));

  const equities: PublicQuote[] = [];
  const bonds: PublicQuote[] = [];

  for (const quote of quotes) {
    const pct = quote.change_pct;
    const last = quote.last;
    const direction: PublicQuote["direction"] =
      pct > 0.0005 ? "up" : pct < -0.0005 ? "down" : "flat";
    const kind = publicAssetKind(quote.symbol, quote.asset_class);
    if (kind === "bond" && last <= 0) continue;

    const item: PublicQuote = {
      symbol: quote.symbol,
      name: quote.name,
      last,
      last_display: fmtPrice(last),
      change_pct: pct,
      change_display: `${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`,
      direction,
      volume: quote.volume,
      asset_class: quote.asset_class,
      asset_kind: kind,
    };

    if (kind === "bond") bonds.push(item);
    else equities.push(item);
  }

  return {
    quotes: equities,
    equities,
    bonds,
    status: await getMarketStatus(),
  };
}

export async function loadTickerSnapshot(): Promise<TickerSnapshot> {
  try {
    const tape = await getPublicTape();
    return {
      data: tape.quotes,
      equities: tape.equities,
      bonds: tape.bonds,
      meta: tape.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Market feed unavailable";
    return {
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
    };
  }
}

export function mapOhlcBars(rows: unknown): Candle[] {
  const candles: Candle[] = [];
  for (const rowRaw of asList(rows)) {
    if (!rowRaw || typeof rowRaw !== "object") continue;
    const row = rowRaw as Record<string, unknown>;
    const time = row.statsDate ?? row.tradeDate ?? row.date ?? row.trade_date;
    if (time === null || time === undefined || time === "") continue;

    const open = Number(row.openPrice ?? row.open ?? 0) || 0;
    const high = Number(row.highPrice ?? row.high ?? 0) || 0;
    const low = Number(row.lowPrice ?? row.low ?? 0) || 0;
    const close = Number(row.closePrice ?? row.close ?? 0) || 0;
    if (open <= 0 && high <= 0 && low <= 0 && close <= 0) continue;

    candles.push({
      time: String(time),
      open: open > 0 ? open : close,
      high: high > 0 ? high : Math.max(open, close),
      low: low > 0 ? low : Math.min(open > 0 ? open : close, close),
      close: close > 0 ? close : open,
      volume: Number(row.turnover ?? row.turnoverValue ?? row.tradesCount ?? row.volume ?? 0) || 0,
    });
  }

  candles.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  return candles;
}

function ohlcAgreesWithLast(candles: Candle[], last: number): boolean {
  if (!candles.length || last <= 0) return false;
  const close = candles[candles.length - 1]?.close ?? 0;
  if (close <= 0) return false;
  return Math.abs(close - last) / last <= 0.35;
}

async function emsCatalog(): Promise<Record<string, number>> {
  try {
    const rows = asList(await marlinGetJson("/exchange-market-securities/"));
    const map: Record<string, number> = {};
    for (const rowRaw of rows) {
      if (!rowRaw || typeof rowRaw !== "object") continue;
      const row = rowRaw as Record<string, unknown>;
      const code = String(row.securityCode ?? row.symbol ?? row.symbolCode ?? "").toUpperCase();
      const ems = row.exchangeMarketSecurityId ?? row.emsId;
      if (!code || ems === null || ems === undefined || ems === "") continue;
      const market = String(row.marketCode ?? "").toUpperCase();
      if (!(code in map) || market === "MAINBOARD") {
        map[code] = Number(ems);
      }
    }
    for (const [code, id] of Object.entries(map)) {
      emsCache.set(code, id);
    }
    return map;
  } catch {
    return {};
  }
}

async function candleMarketIds(quote: Quote): Promise<Array<number | string>> {
  const ids = new Map<string, number | string>();
  const remembered = emsCache.get(quote.symbol);
  if (remembered) ids.set(String(remembered), remembered);
  if (quote.exchange_market_security_id) {
    ids.set(String(quote.exchange_market_security_id), quote.exchange_market_security_id);
  }
  if (!ids.size) {
    const catalog = await emsCatalog();
    if (catalog[quote.symbol]) {
      ids.set(String(catalog[quote.symbol]), catalog[quote.symbol]);
    }
  }
  const hints: Record<string, number> = { ABAYB: 106, BOAX: 119, WGBX: 1 };
  if (hints[quote.symbol]) ids.set(String(hints[quote.symbol]), hints[quote.symbol]);
  if (!ids.size && quote.security_id) {
    ids.set(String(quote.security_id), quote.security_id);
  }
  return [...ids.values()];
}

export async function getCandles(symbol: string, historyDays = 90): Promise<Candle[]> {
  const code = symbol.toUpperCase();
  const days = Math.max(1, Math.min(historyDays, 2000));
  const cacheKey = `${code}:${days}`;
  const cached = candleCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const quote = await getQuote(code);
  if (!quote) {
    candleCache.set(cacheKey, { value: [], expiresAt: Date.now() + 20_000 });
    return [];
  }

  try {
    const ids = await candleMarketIds(quote);
    if (!ids.length) {
      candleCache.set(cacheKey, { value: [], expiresAt: Date.now() + 20_000 });
      return [];
    }

    const last = quote.last;
    for (const securityId of ids) {
      const rows = await marlinGetJson(
        `/reports/get-security-ohlc/exchangeMarketSecurityId/${securityId}/historyDays/${days}/`,
      );
      const candles = mapOhlcBars(rows);
      if (!candles.length) continue;
      if (last > 0 && !ohlcAgreesWithLast(candles, last)) continue;
      emsCache.set(code, Number(securityId));
      candleCache.set(cacheKey, { value: candles, expiresAt: Date.now() + 60_000 });
      return candles;
    }

    candleCache.set(cacheKey, { value: [], expiresAt: Date.now() + 20_000 });
    return [];
  } catch {
    candleCache.set(cacheKey, { value: [], expiresAt: Date.now() + 20_000 });
    return [];
  }
}

export async function getCandlesForWindow(
  symbol: string,
  range: string,
  from?: string | null,
  to?: string | null,
): Promise<{ candles: Candle[]; meta: { range: string; from: string; to: string } }> {
  const window = resolveChartRange(range, from, to);
  const candles = filterCandlesByWindow(
    await getCandles(symbol, window.historyDays),
    window.from,
    window.to,
  );
  return {
    candles,
    meta: { range: window.range, from: window.from, to: window.to },
  };
}
