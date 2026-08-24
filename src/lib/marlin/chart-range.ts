const TIMEZONE = "Africa/Addis_Ababa";

export const CHART_PRESETS = [
  "7d",
  "14d",
  "this_week",
  "this_month",
  "this_year",
  "custom",
] as const;

export type ChartPreset = (typeof CHART_PRESETS)[number];

export type ChartWindow = {
  range: ChartPreset;
  from: string;
  to: string;
  historyDays: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Approximate Addis calendar day using UTC+3 offset. */
export function addisNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utc + 3 * 60 * 60_000);
}

function mondayOf(day: Date): Date {
  const d = startOfDay(day);
  const weekday = d.getDay(); // 0 Sun
  const diff = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + diff);
  return d;
}

function completedThrough(today: Date): Date {
  // Daily OHLC is end-of-day; prefer previous calendar day after close hours.
  const end = startOfDay(today);
  if (today.getHours() < 15) {
    end.setDate(end.getDate() - 1);
  }
  // Skip weekends
  while (end.getDay() === 0 || end.getDay() === 6) {
    end.setDate(end.getDate() - 1);
  }
  return end;
}

export function resolveChartRange(
  range: string,
  from?: string | null,
  to?: string | null,
): ChartWindow {
  const preset = (range || "this_month").toLowerCase() as ChartPreset;
  if (!CHART_PRESETS.includes(preset)) {
    throw new Error("Choose a valid chart range.");
  }

  const today = startOfDay(addisNow());
  const clock = addisNow();
  let start = today;
  let end = completedThrough(clock);

  if (preset === "7d") {
    end = completedThrough(clock);
    start = new Date(end);
    start.setDate(start.getDate() - 6);
  } else if (preset === "14d") {
    end = completedThrough(clock);
    start = new Date(end);
    start.setDate(start.getDate() - 13);
  } else if (preset === "this_week") {
    start = mondayOf(today);
    end = completedThrough(clock);
    if (end < start) start = new Date(end);
  } else if (preset === "this_month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = completedThrough(clock);
  } else if (preset === "this_year") {
    start = new Date(today.getFullYear(), 0, 1);
    end = completedThrough(clock);
  } else if (preset === "custom") {
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new Error("Custom range needs a from and to date.");
    }
    start = startOfDay(new Date(`${from}T00:00:00`));
    end = startOfDay(new Date(`${to}T00:00:00`));
    if (start > end) throw new Error("From date must be on or before to date.");
  }

  if (end < start) start = new Date(end);

  const ms = end.getTime() - start.getTime();
  const days = Math.floor(ms / 86_400_000) + 1;
  const historyDays = Math.min(2000, Math.max(14, days + 14));

  return {
    range: preset,
    from: dayKey(start),
    to: dayKey(end),
    historyDays,
  };
}

export function filterCandlesByWindow<T extends { time: string }>(
  candles: T[],
  from: string,
  to: string,
): T[] {
  return candles.filter((bar) => {
    const day = String(bar.time ?? "").slice(0, 10);
    return day >= from && day <= to;
  });
}

export { TIMEZONE };
