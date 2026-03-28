import { useTranslation } from "react-i18next";
import { Sheet } from "../common/Sheet";
import { TokenIcon } from "../common/TokenIcon";
import { formatPrice } from "../../utils/format";
import { nanoToAmount } from "../../utils/ton";
import { TokenData } from "../../store/tokenStore";

interface SwapConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromToken: TokenData;
  toToken: TokenData;
  fromAmount: string;
  toAmount: string;
  minToAmount: string;
  priceImpact: string;
  route: string[];
  fee: string;
  isSwapping: boolean;
}

export function SwapConfirm({
  isOpen,
  onClose,
  onConfirm,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  minToAmount,
  priceImpact,
  route,
  fee,
  isSwapping,
}: SwapConfirmProps) {
  const { t } = useTranslation();

  const fromDisplay = nanoToAmount(fromAmount, fromToken.decimals);
  const toDisplay = nanoToAmount(toAmount, toToken.decimals);
  const minDisplay = nanoToAmount(minToAmount, toToken.decimals);

  const details = [
    { label: t("swap.rate"), value: `1 ${fromToken.symbol} = ${(toDisplay / fromDisplay).toFixed(6)} ${toToken.symbol}` },
    { label: t("swap.price_impact"), value: `${priceImpact}%` },
    { label: t("swap.min_received"), value: `${minDisplay.toFixed(6)} ${toToken.symbol}` },
    { label: t("swap.fee"), value: fee },
    { label: t("swap.route"), value: route.join(" → ") },
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={t("swap.confirm_swap")}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--spacing-md)",
          padding: "var(--spacing-md) 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
          <div style={{ textAlign: "center" }}>
            <TokenIcon src={fromToken.icon_url} symbol={fromToken.symbol} size={48} address={fromToken.address} />
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, marginTop: 8 }}>
              {fromDisplay.toFixed(4)}
            </div>
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              {fromToken.symbol}
            </div>
          </div>

          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14m-4-4l4 4-4 4" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div style={{ textAlign: "center" }}>
            <TokenIcon src={toToken.icon_url} symbol={toToken.symbol} size={48} address={toToken.address} />
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, marginTop: 8 }}>
              {toDisplay.toFixed(4)}
            </div>
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              {toToken.symbol}
            </div>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
            padding: "var(--spacing-md)",
            background: "var(--color-bg-tertiary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {details.map((d) => (
            <div
              key={d.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "var(--font-size-sm)",
              }}
            >
              <span style={{ color: "var(--color-text-secondary)" }}>{d.label}</span>
              <span style={{ fontWeight: 500 }}>{d.value}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-tertiary)",
            textAlign: "center",
          }}
        >
          {t("swap.powered_by")}
        </div>

        <button
          onClick={onConfirm}
          disabled={isSwapping}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            background: isSwapping ? "var(--color-bg-tertiary)" : "var(--gradient-accent)",
            color: isSwapping ? "var(--color-text-secondary)" : "#0A0E14",
            fontWeight: 700,
            fontSize: "var(--font-size-lg)",
            opacity: isSwapping ? 0.7 : 1,
            transition: "all var(--duration-fast) ease",
          }}
        >
          {isSwapping ? t("swap.swapping") : t("swap.confirm_swap")}
        </button>
      </div>
    </Sheet>
  );
}
