import { TokenIcon } from "../common/TokenIcon";

interface PoolPairIconProps {
  tokenAIcon: string | null;
  tokenASymbol: string;
  tokenAAddress?: string;
  tokenBIcon: string | null;
  tokenBSymbol: string;
  tokenBAddress?: string;
  size?: number;
}

export function PoolPairIcon({
  tokenAIcon,
  tokenASymbol,
  tokenAAddress,
  tokenBIcon,
  tokenBSymbol,
  tokenBAddress,
  size = 32,
}: PoolPairIconProps) {
  const overlap = Math.round(size * 0.25);
  const totalWidth = size * 2 - overlap;

  return (
    <div
      style={{
        position: "relative",
        width: totalWidth,
        height: size,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 2,
          borderRadius: "50%",
        }}
      >
        <TokenIcon src={tokenAIcon} symbol={tokenASymbol} size={size} address={tokenAAddress} />
      </div>
      <div
        style={{
          position: "absolute",
          left: size - overlap,
          top: 0,
          zIndex: 1,
          borderRadius: "50%",
          border: "2px solid var(--color-bg-primary)",
          boxSizing: "content-box",
          marginTop: -2,
          marginLeft: -2,
        }}
      >
        <TokenIcon src={tokenBIcon} symbol={tokenBSymbol} size={size} address={tokenBAddress} />
      </div>
    </div>
  );
}
