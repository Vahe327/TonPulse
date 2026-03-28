import { useState } from "react";
import { KNOWN_TOKEN_ICONS } from "../../utils/constants";

interface TokenIconProps {
  src: string | null;
  symbol: string;
  size?: number;
  address?: string;
}

export function TokenIcon({ src, symbol, size = 40, address }: TokenIconProps) {
  const [srcFailed, setSrcFailed] = useState(false);
  const [knownFailed, setKnownFailed] = useState(false);

  const knownIcon = address ? KNOWN_TOKEN_ICONS[address] : null;

  const effectiveSrc = src && !srcFailed ? src : null;
  const effectiveKnown = knownIcon && !knownFailed ? knownIcon : null;

  const finalSrc = effectiveSrc || effectiveKnown;

  if (finalSrc) {
    return (
      <img
        src={finalSrc}
        alt={symbol}
        width={size}
        height={size}
        onError={() => {
          if (finalSrc === effectiveSrc) {
            setSrcFailed(true);
          } else {
            setKnownFailed(true);
          }
        }}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  const colors = [
    "#00D4AA",
    "#7C5CFC",
    "#FF4757",
    "#FFA502",
    "#00B4D8",
    "#E056A0",
  ];
  const colorIndex =
    symbol.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    colors.length;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors[colorIndex]}33, ${colors[colorIndex]}66)`,
        border: `1px solid ${colors[colorIndex]}44`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.35,
        color: colors[colorIndex],
        flexShrink: 0,
      }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}
