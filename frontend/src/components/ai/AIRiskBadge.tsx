import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AIRiskBadgeProps {
  score: number | null;
  size?: number;
}

function getColor(score: number): string {
  if (score <= 3) return "#00D4AA";
  if (score <= 6) return "#FFA502";
  return "#FF4757";
}

function getLabel(score: number): string {
  if (score <= 3) return "Low Risk";
  if (score <= 6) return "Moderate";
  return "High Risk";
}

export function AIRiskBadge({ score, size = 22 }: AIRiskBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (score === null) return null;

  const color = getColor(score);
  const radius = (size - 3) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 10;
  const dashOffset = circumference * (1 - progress);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        style={{
          width: size,
          height: size,
          padding: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={2.5}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span
          style={{
            position: "absolute",
            fontSize: size * 0.4,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            style={{
              position: "absolute",
              top: size + 4,
              right: 0,
              background: "var(--color-bg-secondary)",
              border: `1px solid ${color}33`,
              borderRadius: "var(--radius-xs)",
              padding: "4px 8px",
              fontSize: 11,
              whiteSpace: "nowrap",
              zIndex: 50,
              color: "var(--color-text-secondary)",
            }}
          >
            {getLabel(score)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
