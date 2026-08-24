"use client";

import { useMarketData } from "@/components/MarketDataProvider";
import type { PublicQuote } from "@/lib/marlin/types";

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
  const { equities, meta } = useMarketData();
  const quotes = equities;
  const live = Boolean(meta.broker_connected);
  const source = String(meta.source || "offline");
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
