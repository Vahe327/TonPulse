interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = "var(--radius-xs)",
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "var(--color-bg-tertiary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--gradient-shimmer)",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </div>
  );
}
