# Kapital temporary site (`kapital.et`)

Next.js marketing site with a live ESX market board and charts.

Market data is fetched **server-side only** through the broker-proxy. The browser never talks to Marlin or `196.189.51.9:3000` directly.

## Setup

```bash
cp .env.example .env.local
# fill MARLIN_PROXY_SECRET, MARLIN_USERNAME, MARLIN_PASSWORD
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
|----------|---------|
| `MARLIN_PROXY_URL` | Broker proxy base URL (default `http://196.189.51.9:3000`) |
| `MARLIN_PROXY_SECRET` | Shared `X-Proxy-Secret` for `POST /relay` |
| `MARLIN_USERNAME` | Marlin investor username / email |
| `MARLIN_PASSWORD` | Marlin investor password |
| `MARLIN_TIMEOUT_MS` | Optional request timeout (default `30000`) |
| `MARLIN_CACHE_TTL_MS` | Optional watchlist cache TTL (default `20000`) |

## Public API (browser → Next.js)

- `GET /api/market/ticker` — equities/bonds board payload
- `GET /api/market/candles/:symbol?range=this_month` — OHLC window

These routes call the proxy with investor credentials on the server.
