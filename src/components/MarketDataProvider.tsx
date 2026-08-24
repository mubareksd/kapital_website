"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TickerSnapshot } from "@/lib/marlin/types";

type MarketDataContextValue = TickerSnapshot & {
  refresh: () => Promise<void>;
};

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
  const [snapshot, setSnapshot] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/market/ticker", { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as TickerSnapshot;
      setSnapshot({
        data: json.data ?? json.equities ?? [],
        equities: json.equities ?? json.data ?? [],
        bonds: json.bonds ?? [],
        meta: json.meta ?? emptySnapshot.meta,
      });
    } catch {
      // Keep the last snapshot.
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

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
