import { useState, useRef, ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        flex: 1,
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: pullDistance,
          overflow: "hidden",
          transition: pulling ? "none" : "height var(--duration-normal) var(--ease-out)",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid var(--color-accent)",
            borderTopColor: "transparent",
            animation: refreshing ? "spin 0.8s linear infinite" : "none",
            transform: `rotate(${pullDistance * 3}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
