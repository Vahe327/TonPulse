import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TokenIcon } from "../common/TokenIcon";
import { PriceChange } from "../common/PriceChange";
import { formatPrice, formatTokenAmount } from "../../utils/format";
import { useTelegram } from "../../hooks/useTelegram";

interface TokenRowProps {
  address: string;
  symbol: string;
  name: string;
  iconUrl: string | null;
  balanceFormatted: string;
  valueUsd: string;
  priceUsd: string;
  change24h: string | null;
  portfolioShare: string;
  index: number;
}

export function TokenRow({
  address,
  symbol,
  name,
  iconUrl,
  balanceFormatted,
  valueUsd,
  priceUsd,
  change24h,
  portfolioShare,
  index,
}: TokenRowProps) {
  const navigate = useNavigate();
  const { hapticImpact } = useTelegram();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => {
        hapticImpact("light");
        navigate(`/token/${encodeURIComponent(address)}`);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-sm)",
        padding: "12px var(--spacing-md)",
        width: "100%",
        textAlign: "left",
        borderBottom: "1px solid var(--color-border)",
        transition: "background var(--duration-fast) ease",
      }}
    >
      <TokenIcon src={iconUrl} symbol={symbol} size={40} address={address} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: 600 }}>{symbol}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: "var(--font-size-md)",
            }}
          >
            {formatPrice(valueUsd)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
            }}
          >
            {formatTokenAmount(balanceFormatted)} {symbol}
            {priceUsd && parseFloat(priceUsd) > 0 && (
              <span style={{ color: "var(--color-text-tertiary)", marginLeft: 4 }}>
                @ {formatPrice(priceUsd)}
              </span>
            )}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PriceChange value={change24h} />
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {parseFloat(portfolioShare).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
