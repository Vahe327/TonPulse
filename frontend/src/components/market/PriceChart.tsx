import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createChart, IChartApi, ColorType, LineStyle, CandlestickData, Time } from "lightweight-charts";
import { api } from "../../services/api";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceChartProps {
  tokenAddress: string;
  tokenSymbol: string;
  height?: number;
}

const TIMEFRAMES = ["hour1", "hour4", "day"] as const;
type Timeframe = typeof TIMEFRAMES[number];

const TF_LABELS: Record<Timeframe, string> = {
  hour1: "1H",
  hour4: "4H",
  day: "1D",
};

export function PriceChart({ tokenAddress, tokenSymbol, height = 300 }: PriceChartProps) {
  const { t } = useTranslation();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const prevAddressRef = useRef(tokenAddress);

  useEffect(() => {
    if (prevAddressRef.current !== tokenAddress) {
      prevAddressRef.current = tokenAddress;
      setCandles([]);
      setLoading(true);
      setTimeframe("day");
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    }
  }, [tokenAddress]);

  const fetchOHLCV = useCallback(async (tf: Timeframe, addr: string) => {
    setLoading(true);
    try {
      const data = await api.get<{ candles: Candle[]; timeframe: string }>(
        `/tokens/${encodeURIComponent(addr)}/ohlcv?timeframe=${tf}`
      );
      setCandles(data.candles);
    } catch {
      setCandles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await api.get<{ candles: Candle[]; timeframe: string }>(
          `/tokens/${encodeURIComponent(tokenAddress)}/ohlcv?timeframe=${timeframe}`
        );
        if (!cancelled) setCandles(data.candles);
      } catch {
        if (!cancelled) setCandles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [timeframe, tokenAddress]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    if (!chartContainerRef.current || candles.length === 0) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b95a5",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.1)", style: LineStyle.Dashed },
        horzLine: { color: "rgba(255,255,255,0.1)", style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: timeframe !== "day",
      },
      handleScale: { axisPressedMouseMove: { time: true, price: false } },
      handleScroll: { vertTouchDrag: false },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#00D4AA",
      downColor: "#FF4757",
      borderUpColor: "#00D4AA",
      borderDownColor: "#FF4757",
      wickUpColor: "#00D4AA",
      wickDownColor: "#FF4757",
    });

    const chartData: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    series.setData(chartData);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, height, timeframe]);

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--spacing-md)",
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text-secondary)",
        }}>
          {tokenSymbol} — {t("token.chart")}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                background: timeframe === tf ? "var(--color-accent-dim)" : "transparent",
                color: timeframe === tf ? "var(--color-accent)" : "var(--color-text-tertiary)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {TF_LABELS[tf]}
            </button>
          ))}
        </div>
      </div>

      <div ref={chartContainerRef} style={{
        width: "100%",
        height,
        display: loading || candles.length === 0 ? "none" : "block",
      }} />

      {loading && (
        <div style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-tertiary)",
        }}>
          <div style={{ animation: "pulse 1.5s infinite" }}>...</div>
        </div>
      )}

      {!loading && candles.length === 0 && (
        <div style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-tertiary)",
          fontSize: 13,
        }}>
          {t("token.no_chart_data")}
        </div>
      )}
    </div>
  );
}
