"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PublicQuote, TickerSnapshot } from "@/lib/marlin/types";

type MarketDataContextValue = TickerSnapshot & {
  refresh: () => Promise<void>;
};

function normalizeQuote(quote: PublicQuote): PublicQuote {
  const volume = Number(quote.volume) || 0;
  const last = Number(quote.last) || 0;
  const turnover =
    Number(quote.turnover) > 0 ? Number(quote.turnover) : volume * last;
  return { ...quote, volume, last, turnover };
}

const emptySnapshot: TickerSnapshot = {
  data: [],
  equities: [],
  bonds: [],
  meta: {
    broker_connected: false,
    source: "offline",
    exchange: "ESX",
    market: "MAINBOARD",
    error: null,
  },
};

const MarketDataContext = createContext<MarketDataContextValue>({
  ...emptySnapshot,
  refresh: async () => {},
});

export function MarketDataProvider({
  initial,
  children,
}: {
  initial: TickerSnapshot;
  children: React.ReactNode;
}) {
  const [snapshot, setSnapshot] = useState(() => ({
    ...initial,
    equities: (initial.equities ?? []).map(normalizeQuote),
    bonds: (initial.bonds ?? []).map(normalizeQuote),
    data: (initial.data ?? initial.equities ?? []).map(normalizeQuote),
  }));

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/market/ticker", { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as TickerSnapshot;
      setSnapshot({
        data: json.data ?? json.equities ?? [],
        equities: (json.equities ?? json.data ?? []).map(normalizeQuote),
        bonds: (json.bonds ?? []).map(normalizeQuote),
        meta: json.meta ?? emptySnapshot.meta,
      });
    } catch {
      // Keep the last snapshot.
    }
  }, []);

  useEffect(() => {
    const empty = initial.equities.length === 0 && initial.bonds.length === 0;
    const kickoff = window.setTimeout(() => {
      if (empty) void refresh();
    }, 0);
    const timer = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [initial.bonds.length, initial.equities.length, refresh]);

  const value = useMemo(
    () => ({ ...snapshot, refresh }),
    [snapshot, refresh],
  );

  return (
    <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>
  );
}

export function useMarketData(): MarketDataContextValue {
  return useContext(MarketDataContext);
}
