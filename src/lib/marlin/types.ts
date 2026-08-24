export type Quote = {
  symbol: string;
  name: string;
  last: number;
  change_pct: number;
  volume: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  exchange: string;
  market: string;
  asset_class: string;
  exchange_market_security_id: number | null;
  security_id: number | null;
  source: string;
};

export type PublicQuote = {
  symbol: string;
  name: string;
  last: number;
  last_display: string;
  change_pct: number;
  change_display: string;
  direction: "up" | "down" | "flat";
  volume: number;
  asset_class: string;
  asset_kind: "equity" | "bond";
  logo_url?: string | null;
};

export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketStatus = {
  broker_connected: boolean;
  source: "live" | "offline";
  exchange: string;
  market: string;
  error: string | null;
};

export type TickerSnapshot = {
  data: PublicQuote[];
  equities: PublicQuote[];
  bonds: PublicQuote[];
  meta: MarketStatus;
};
