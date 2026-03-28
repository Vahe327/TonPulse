import { useEffect, useRef } from "react";
import { createChart, IChartApi, ColorType, LineStyle } from "lightweight-charts";

interface PnLChartProps {
  positive?: boolean;
}

export function PnLChart({ positive = true }: PnLChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const data = Array.from({ length: 7 }, (_, i) => ({
    time: new Date(Date.now() - (7 - i) * 86400000).toISOString().split("T")[0],
    value: 100 + Math.random() * 20 + i * 2,
  }));

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const container = containerRef.current;
    const lineColor = positive ? "#00D4AA" : "#FF4757";

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 120,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b95a5",
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
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", visible: false },
      handleScale: false,
      handleScroll: false,
    });

    const series = chart.addAreaSeries({
      lineColor,
      topColor: positive ? "rgba(0,212,170,0.3)" : "rgba(255,71,87,0.3)",
      bottomColor: positive ? "rgba(0,212,170,0.01)" : "rgba(255,71,87,0.01)",
      lineWidth: 2,
    });

    series.setData(data as any);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [positive]);

  return (
    <div style={{ padding: "0 var(--spacing-md)" }}>
      <div ref={containerRef} style={{ width: "100%", height: 120 }} />
    </div>
  );
}
