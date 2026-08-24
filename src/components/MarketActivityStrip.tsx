"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarketData } from "@/components/MarketDataProvider";
import type { MarketActivity } from "@/lib/marlin/types";

function fmtCompact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}bn`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}m`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtShares(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 shares";
  return `${Math.round(value).toLocaleString()} shares`;
}

function liveToday(equities: { volume: number; turnover: number }[], bonds: { volume: number; turnover: number }[]) {
  let value = 0;
  let volume = 0;
  for (const row of [...equities, ...bonds]) {
    volume += Number(row.volume) || 0;
    value += Number(row.turnover) || 0;
  }
  return { value, volume };
}

const CARDS = [
  { key: "today" as const, label: "Today" },
  { key: "month" as const, label: "This month" },
  { key: "year" as const, label: "This year" },
  { key: "all" as const, label: "All time" },
];

export function MarketActivityStrip() {
  const { equities, bonds } = useMarketData();
  const [activity, setActivity] = useState<MarketActivity | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const res = await fetch("/api/market/activity", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as MarketActivity;
        if (cancelled) return;
        setActivity(json);
        if (!json.ready) {
          timer = window.setTimeout(() => {
            void load();
          }, 3_000);
        }
      } catch {
        if (!cancelled) {
          timer = window.setTimeout(() => {
            void load();
          }, 5_000);
        }
      }
    };

    void load();
    const refresh = window.setInterval(() => {
      void load();
    }, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const todayLive = useMemo(
    () => liveToday(equities, bonds),
    [bonds, equities],
  );

  const cards = CARDS.map((card) => {
    if (card.key === "today") {
      const bucket = todayLive.value > 0 || todayLive.volume > 0
        ? todayLive
        : activity?.today;
      return {
        ...card,
        value: bucket?.value ?? 0,
        volume: bucket?.volume ?? 0,
        pending: false,
      };
    }
    const bucket = activity?.[card.key];
    return {
      ...card,
      value: bucket?.value ?? 0,
      volume: bucket?.volume ?? 0,
      pending: !activity?.ready,
    };
  });

  return (
    <section id="activity" className="section section-activity">
      <div className="container">
        <div className="section-head-row">
          <div>
            <p className="section-label">Market activity</p>
            <h2>How much has traded on ESX</h2>
            <p className="activity-lead">
              Turnover in ETB across listed equities and bonds
              {activity?.from ? `, from ${activity.from}` : ""}.
            </p>
          </div>
        </div>

        <div className="activity-grid" role="list">
          {cards.map((card) => (
            <article key={card.key} className="activity-card" role="listitem">
              <p className="activity-label">{card.label}</p>
              <p className="activity-value">
                {card.pending && card.value <= 0 ? (
                  <span className="activity-pending">Loading</span>
                ) : (
                  <>
                    <span className="activity-amount">{fmtCompact(card.value)}</span>
                    <span className="activity-currency"> ETB</span>
                  </>
                )}
              </p>
              <p className="activity-volume">
                {card.pending && card.volume <= 0
                  ? "Fetching history"
                  : fmtShares(card.volume)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
