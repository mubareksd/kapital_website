import { addisNow, dayKey, filterCandlesByWindow, resolveChartRange } from "./chart-range";
import { getCandles, getWatchlist } from "./market";
import type { ActivityBucket, Candle, MarketActivity, Quote } from "./types";

const HISTORY_DAYS = 2000;
const ACTIVITY_TTL_MS = 10 * 60_000;
const FETCH_BATCH = 4;

let activityHold: { value: MarketActivity; expiresAt: number } | null = null;
let activityInflight: Promise<MarketActivity> | null = null;

function zeroBucket(): ActivityBucket {
  return { value: 0, volume: 0 };
}

function addBucket(target: ActivityBucket, value: number, volume: number): void {
  target.value += value;
  target.volume += volume;
}

function quoteToday(quotes: Quote[]): ActivityBucket {
  const bucket = zeroBucket();
  for (const quote of quotes) {
    const volume = Number(quote.volume) || 0;
    const turnover =
      quote.turnover > 0 ? quote.turnover : volume * (Number(quote.last) || 0);
    addBucket(bucket, turnover, volume);
  }
  return bucket;
}

function sumCandles(candles: Candle[]): ActivityBucket {
  const bucket = zeroBucket();
  for (const bar of candles) {
    const volume = Number(bar.volume) || 0;
    const turnover =
      bar.turnover > 0 ? bar.turnover : volume * (Number(bar.close) || 0);
    addBucket(bucket, turnover, volume);
  }
  return bucket;
}

function withLiveToday(
  historical: ActivityBucket,
  live: ActivityBucket,
  latestBar: string | null,
  today: string,
): ActivityBucket {
  if (latestBar && latestBar >= today) return historical;
  return {
    value: historical.value + live.value,
    volume: historical.volume + live.volume,
  };
}

async function mapPool<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

export function emptyMarketActivity(): MarketActivity {
  return {
    today: zeroBucket(),
    month: zeroBucket(),
    year: zeroBucket(),
    all: zeroBucket(),
    listings: 0,
    from: null,
    ready: false,
  };
}

export function peekMarketActivity(): MarketActivity | null {
  return activityHold?.value ?? null;
}

async function computeMarketActivity(): Promise<MarketActivity> {
  const quotes = await getWatchlist();
  const todayLive = quoteToday(quotes);
  const today = dayKey(addisNow());
  const monthWindow = resolveChartRange("this_month");
  const yearWindow = resolveChartRange("this_year");

  const histories = await mapPool(quotes, FETCH_BATCH, async (quote) => {
    try {
      return await getCandles(quote.symbol, HISTORY_DAYS);
    } catch {
      return [] as Candle[];
    }
  });

  const month = zeroBucket();
  const year = zeroBucket();
  const all = zeroBucket();
  let from: string | null = null;
  let latestBar: string | null = null;

  for (const candles of histories) {
    if (!candles.length) continue;
    const first = String(candles[0].time).slice(0, 10);
    const last = String(candles[candles.length - 1].time).slice(0, 10);
    if (!from || first < from) from = first;
    if (!latestBar || last > latestBar) latestBar = last;

    const monthSum = sumCandles(
      filterCandlesByWindow(candles, monthWindow.from, monthWindow.to),
    );
    const yearSum = sumCandles(
      filterCandlesByWindow(candles, yearWindow.from, yearWindow.to),
    );
    const allSum = sumCandles(candles);
    addBucket(month, monthSum.value, monthSum.volume);
    addBucket(year, yearSum.value, yearSum.volume);
    addBucket(all, allSum.value, allSum.volume);
  }

  return {
    today: todayLive,
    month: withLiveToday(month, todayLive, latestBar, today),
    year: withLiveToday(year, todayLive, latestBar, today),
    all: withLiveToday(all, todayLive, latestBar, today),
    listings: quotes.length,
    from,
    ready: true,
  };
}

export async function loadMarketActivity(
  options: { maxWaitMs?: number } = {},
): Promise<MarketActivity> {
  const now = Date.now();
  if (activityHold && activityHold.expiresAt > now) {
    return {
      ...activityHold.value,
      today: quoteToday(await getWatchlist()),
    };
  }

  if (!activityInflight) {
    activityInflight = (async () => {
      try {
        const value = await computeMarketActivity();
        activityHold = { value, expiresAt: Date.now() + ACTIVITY_TTL_MS };
        return value;
      } catch {
        return activityHold?.value ?? emptyMarketActivity();
      } finally {
        activityInflight = null;
      }
    })();
  }

  if (activityHold) {
    return {
      ...activityHold.value,
      today: quoteToday(await getWatchlist()),
    };
  }

  const maxWaitMs = options.maxWaitMs ?? 400;
  const timedOut = await Promise.race([
    activityInflight.then(() => false),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(true), maxWaitMs);
    }),
  ]);
  if (!timedOut) return activityInflight;

  const today = quoteToday(await getWatchlist().catch(() => []));
  return { ...emptyMarketActivity(), today, listings: 0, ready: false };
}

export function warmMarketActivity(): void {
  void loadMarketActivity({ maxWaitMs: 0 });
}
