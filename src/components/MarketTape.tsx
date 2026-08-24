"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicQuote } from "@/lib/marlin/types";

type TickerResponse = {
  data?: PublicQuote[];
  equities?: PublicQuote[];
  meta?: {
    broker_connected?: boolean;
    source?: string;
    error?: string | null;
  };
};

function TapeItems({ quotes }: { quotes: PublicQuote[] }) {
  return (
    <>
      {quotes.map((quote) => {
        const dir = ["up", "down", "flat"].includes(quote.direction)
          ? quote.direction
          : "flat";
        return (
          <span key={`${quote.symbol}-${quote.last_display}`} className={`tape-item dir-${dir}`}>
            <strong className="inst-symbol">{quote.symbol}</strong>
            <span className="tape-px">{quote.last_display}</span>
            <span className="tape-chg">{quote.change_display}</span>
          </span>
        );
      })}
    </>
  );
}

export function MarketTape() {
  const [quotes, setQuotes] = useState<PublicQuote[]>([]);
  const [live, setLive] = useState(false);
  const [source, setSource] = useState("offline");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/market/ticker", { cache: "no-store" });
      if (!response.ok) return;
      const json = (await response.json()) as TickerResponse;
      const next = json.equities ?? json.data ?? [];
      setQuotes(next);
      setLive(Boolean(json.meta?.broker_connected));
      setSource(String(json.meta?.source || "offline"));
    } catch {
      // Keep last snapshot on the tape.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const kickoff = window.setTimeout(() => {
      if (!cancelled) void refresh();
    }, 0);
    const timer = window.setInterval(() => {
      if (!cancelled) void refresh();
    }, 30_000);
    return () => {
      cancelled = true;
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const seconds = Math.max(18, quotes.length * 2.4);

  return (
    <div className="tape" style={{ ["--tape-seconds" as string]: `${seconds}s` }}>
      <div className="tape-rail">
        <div className="tape-badge">
          <span className={`tape-dot ${live ? "is-live" : "is-off"}`} />
          <span className="tape-exchange">ESX</span>
          <span className="tape-state">{live ? "LIVE" : source.toUpperCase()}</span>
        </div>
        <div className="tape-viewport" aria-label="ESX market prices">
          {quotes.length > 0 ? (
            <div className="tape-track">
              <div className="tape-run">
                <TapeItems quotes={quotes} />
              </div>
              <div className="tape-run" aria-hidden="true">
                <TapeItems quotes={quotes} />
              </div>
            </div>
          ) : (
            <p className="tape-empty">
              ESX quotes appear here when the market feed is connected.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
