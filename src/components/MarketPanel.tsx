"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMarketData } from "@/components/MarketDataProvider";
import { InstitutionMark } from "@/components/InstitutionMark";
import type { Candle } from "@/lib/marlin/types";

function fmtPrice(value: number): string {
  const digits = value > 0 && value < 0.01 ? 4 : 2;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const RANGES = [
  { id: "7d", label: "7D" },
  { id: "14d", label: "14D" },
  { id: "this_week", label: "This week" },
  { id: "this_month", label: "This month" },
  { id: "this_year", label: "YTD" },
] as const;

type ChartRangeId = (typeof RANGES)[number]["id"];

type MarketPanelProps = {
  initialSymbol?: string;
  initialRange?: ChartRangeId;
  initialCandles?: Candle[];
};

export function MarketPanel({
  initialSymbol = "",
  initialRange = "this_month",
  initialCandles = [],
}: MarketPanelProps) {
  const { equities, bonds, meta } = useMarketData();
  const [kind, setKind] = useState<"equity" | "bond">(
    equities.length === 0 && bonds.length > 0 ? "bond" : "equity",
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("symbol");
  const [pickedSymbol, setPickedSymbol] = useState(initialSymbol);
  const [range, setRange] = useState<ChartRangeId>(initialRange);
  const [candles, setCandles] = useState<Candle[]>(initialCandles);
  const [chartType, setChartType] = useState<"line" | "candle">("line");
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartTick, setChartTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const skipFirstCandleFetch = useRef(initialCandles.length > 0);
  const symbol =
    pickedSymbol || equities[0]?.symbol || bonds[0]?.symbol || "";

  const status = meta.broker_connected
    ? "Live ESX feed"
    : meta.error || "Feed offline";
  const error = meta.error;
  const loadingBoard = false;

  const loadCandles = useCallback(async (code: string, nextRange: string) => {
    if (!code) {
      setCandles([]);
      return;
    }
    setLoadingChart(true);
    try {
      const params = new URLSearchParams({ range: nextRange });
      const res = await fetch(
        `/api/market/candles/${encodeURIComponent(code)}?${params}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setCandles([]);
        return;
      }
      const json = (await res.json()) as { data?: Candle[] };
      setCandles(Array.isArray(json.data) ? json.data : []);
    } catch {
      setCandles([]);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    if (skipFirstCandleFetch.current) {
      skipFirstCandleFetch.current = false;
      return;
    }
    void loadCandles(symbol, range);
  }, [symbol, range, loadCandles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setChartTick((tick) => tick + 1);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(() => {
    const source = kind === "bond" ? bonds : equities;
    const q = query.trim().toLowerCase();
    let filtered = source;
    if (q) {
      filtered = source.filter(
        (row) =>
          row.symbol.toLowerCase().includes(q) ||
          row.name.toLowerCase().includes(q),
      );
    }
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "change_desc") return b.change_pct - a.change_pct;
      if (sort === "change_asc") return a.change_pct - b.change_pct;
      if (sort === "last_desc") return b.last - a.last;
      if (sort === "last_asc") return a.last - b.last;
      return a.symbol.localeCompare(b.symbol);
    });
    return sorted;
  }, [bonds, equities, kind, query, sort]);

  const activeQuote =
    equities.find((q) => q.symbol === symbol) ||
    bonds.find((q) => q.symbol === symbol) ||
    null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 280;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!candles.length) {
      ctx.fillStyle = "#5a6a62";
      ctx.font = "14px sans-serif";
      ctx.fillText(
        loadingChart ? "Loading chart…" : "No completed daily bars for this range.",
        16,
        height / 2,
      );
      return;
    }

    const pad = { top: 16, right: 56, bottom: 28, left: 12 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    let min = candles[0].low || candles[0].close;
    let max = candles[0].high || candles[0].close;
    for (const bar of candles) {
      min = Math.min(min, bar.low || bar.close, bar.open, bar.close);
      max = Math.max(max, bar.high || bar.close, bar.open, bar.close);
    }
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const padY = (max - min) * 0.06;
    min -= padY;
    max += padY;

    const xAt = (i: number) => pad.left + ((i + 0.5) / candles.length) * plotW;
    const yAt = (price: number) => pad.top + ((max - price) / (max - min)) * plotH;
    const upTrend = candles[candles.length - 1].close >= candles[0].close;
    const lineColor = upTrend ? "#0b7a52" : "#b4233a";

    ctx.strokeStyle = "rgba(197,206,198,0.9)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const y = pad.top + (plotH * i) / 3;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
      const price = max - ((max - min) * i) / 3;
      ctx.fillStyle = "#5a6a62";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(fmtPrice(price), width - pad.right + 6, y + 4);
    }

    if (chartType === "candle") {
      const slot = plotW / candles.length;
      for (let i = 0; i < candles.length; i += 1) {
        const bar = candles[i];
        const x = xAt(i);
        const up = bar.close >= bar.open;
        const color = up ? "#0b7a52" : "#b4233a";
        const bodyTop = yAt(Math.max(bar.open, bar.close));
        const bodyBot = yAt(Math.min(bar.open, bar.close));
        const bodyH = Math.max(1, bodyBot - bodyTop);
        const bodyW = Math.max(2, Math.min(14, slot * 0.62));
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, yAt(bar.high));
        ctx.lineTo(x, yAt(bar.low));
        ctx.lineWidth = Math.max(1, slot * 0.12);
        ctx.stroke();
        ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
      }
    } else {
      ctx.beginPath();
      candles.forEach((bar, i) => {
        const x = xAt(i);
        const y = yAt(bar.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      const baseY = height - pad.bottom;
      ctx.lineTo(xAt(candles.length - 1), baseY);
      ctx.lineTo(xAt(0), baseY);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, pad.top, 0, baseY);
      fill.addColorStop(0, upTrend ? "rgba(11,122,82,0.22)" : "rgba(180,35,58,0.18)");
      fill.addColorStop(1, "rgba(11,122,82,0)");
      ctx.fillStyle = fill;
      ctx.fill();
    }

    ctx.fillStyle = "#5a6a62";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(candles[0].time).slice(0, 10), pad.left, height - 8);
    ctx.textAlign = "right";
    ctx.fillText(
      String(candles[candles.length - 1].time).slice(0, 10),
      width - pad.right,
      height - 8,
    );
  }, [candles, chartTick, chartType, loadingChart]);

  const downloadCsv = () => {
    const lines = [["Symbol", "Company", "Price (ETB)", "Change %", "Volume"].join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.symbol,
          `"${row.name.replaceAll('"', '""')}"`,
          row.last,
          row.change_pct,
          row.volume,
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `esx-${kind}-board.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="market-panel">
      <section id="board" className="section section-muted">
        <div className="container">
          <div className="section-head-row">
            <div>
              <p className="section-label">ESX market board</p>
              <h2>Live last prices in ETB</h2>
            </div>
            <p className="board-meta">
              <span>{rows.length}</span> listings · {status}
            </p>
          </div>

          {error && !equities.length && !bonds.length ? (
            <p className="market-empty">{error}</p>
          ) : null}

          <div className="board-tabs" role="tablist" aria-label="Asset class">
            <button
              type="button"
              className={`board-tab ${kind === "equity" ? "is-active" : ""}`}
              onClick={() => setKind("equity")}
            >
              Equities <span className="board-tab-count">{equities.length}</span>
            </button>
            <button
              type="button"
              className={`board-tab ${kind === "bond" ? "is-active" : ""}`}
              onClick={() => setKind("bond")}
            >
              Bonds <span className="board-tab-count">{bonds.length}</span>
            </button>
          </div>

          <div className="board-tools">
            <label className="board-search">
              <span className="sr-only">Search listings</span>
              <input
                type="search"
                placeholder="Search symbol or name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="board-sort">
              <span>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="symbol">Symbol A–Z</option>
                <option value="change_desc">Change high to low</option>
                <option value="change_asc">Change low to high</option>
                <option value="last_desc">Price high to low</option>
                <option value="last_asc">Price low to high</option>
              </select>
            </label>
            <button type="button" className="button button-secondary button-sm board-csv" onClick={downloadCsv}>
              Download CSV
            </button>
          </div>

          <div className="board-table-wrap">
            {loadingBoard ? (
              <p className="market-empty">Loading board…</p>
            ) : rows.length === 0 ? (
              <p className="market-empty">No listings match this filter.</p>
            ) : (
              <table className="board-table board-table-live">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th className="col-name">Company</th>
                    <th className="num">Price (ETB)</th>
                    <th className="num">Change</th>
                    <th className="num col-volume">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.symbol}
                      className={row.symbol === symbol ? "is-active" : undefined}
                      onClick={() => setPickedSymbol(row.symbol)}
                    >
                      <td data-label="Symbol">
                        <InstitutionMark
                          symbol={row.symbol}
                          name={row.name}
                          logoUrl={row.logo_url}
                          size="md"
                        />
                      </td>
                      <td className="col-name" data-label="Company">
                        {row.name}
                      </td>
                      <td className="num" data-label="Price">
                        {row.last_display}
                      </td>
                      <td className={`num dir-${row.direction}`} data-label="Change">
                        {row.change_display}
                      </td>
                      <td className="num col-volume" data-label="Volume">
                        {Number(row.volume || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section id="charts" className="section">
        <div className="container">
          <div className="section-head-row">
            <div>
              <p className="section-label">Price charts</p>
              <h2>
                {activeQuote ? (
                  <span className="chart-heading">
                    <InstitutionMark
                      symbol={activeQuote.symbol}
                      name={activeQuote.name}
                      logoUrl={activeQuote.logo_url}
                      size="lg"
                    />
                    <span className="muted chart-name">{activeQuote.name}</span>
                  </span>
                ) : (
                  "Select a listing"
                )}
              </h2>
              {activeQuote ? (
                <p className="chart-quote-meta">
                  <strong>{activeQuote.last_display}</strong> ETB{" "}
                  <span className={`dir-${activeQuote.direction}`}>
                    {activeQuote.change_display}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="chart-controls">
            <div className="chart-range-row">
              {RANGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chip ${range === item.id ? "is-active" : ""}`}
                  onClick={() => setRange(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="chart-type-row">
              <button
                type="button"
                className={`chip ${chartType === "line" ? "is-active" : ""}`}
                onClick={() => setChartType("line")}
              >
                Area
              </button>
              <button
                type="button"
                className={`chip ${chartType === "candle" ? "is-active" : ""}`}
                onClick={() => setChartType("candle")}
              >
                Candles
              </button>
            </div>
          </div>

          <div className="chart-frame">
            <canvas ref={canvasRef} className="chart-canvas" aria-label="Price chart" />
          </div>

          <div className="chart-table-wrap">
            <table className="board-table board-table-ohlc">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="num">Open</th>
                  <th className="num col-ohlc-mid">High</th>
                  <th className="num col-ohlc-mid">Low</th>
                  <th className="num">Close</th>
                  <th className="num col-volume">Volume</th>
                </tr>
              </thead>
              <tbody>
                {[...candles].reverse().slice(0, 30).map((bar) => (
                  <tr key={String(bar.time)}>
                    <td data-label="Date">{String(bar.time).slice(0, 10)}</td>
                    <td className="num" data-label="Open">
                      {fmtPrice(bar.open)}
                    </td>
                    <td className="num col-ohlc-mid" data-label="High">
                      {fmtPrice(bar.high)}
                    </td>
                    <td className="num col-ohlc-mid" data-label="Low">
                      {fmtPrice(bar.low)}
                    </td>
                    <td className="num" data-label="Close">
                      {fmtPrice(bar.close)}
                    </td>
                    <td className="num col-volume" data-label="Volume">
                      {Number(bar.volume || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!candles.length ? (
              <p className="market-empty">
                {loadingChart ? "Loading OHLC…" : "No OHLC rows for this window."}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
