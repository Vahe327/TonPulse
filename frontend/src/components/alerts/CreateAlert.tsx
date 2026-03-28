import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "../common/Sheet";
import { TokenSelector } from "../swap/TokenSelector";
import { TokenIcon } from "../common/TokenIcon";
import { formatPrice } from "../../utils/format";
import { TokenData } from "../../store/tokenStore";
import { useTelegram } from "../../hooks/useTelegram";

interface CreateAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    token_address: string;
    token_symbol: string;
    condition: "above" | "below";
    target_price: number;
    current_price_at_creation: number;
  }) => void;
}

export function CreateAlert({ isOpen, onClose, onCreate }: CreateAlertProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const [token, setToken] = useState<TokenData | null>(null);
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handleCreate = () => {
    if (!token || !targetPrice || parseFloat(targetPrice) <= 0) return;
    hapticImpact("medium");
    onCreate({
      token_address: token.address,
      token_symbol: token.symbol,
      condition,
      target_price: parseFloat(targetPrice),
      current_price_at_creation: parseFloat(token.price_usd || "0"),
    });
    setToken(null);
    setTargetPrice("");
    onClose();
  };

  const handlePriceInput = (val: string) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setTargetPrice(val);
    }
  };

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} title={t("alerts.create")}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          <button
            onClick={() => setSelectorOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              padding: "12px var(--spacing-md)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              width: "100%",
              textAlign: "left",
            }}
          >
            {token ? (
              <>
                <TokenIcon src={token.icon_url} symbol={token.symbol} size={28} address={token.address} />
                <span style={{ fontWeight: 600, flex: 1 }}>{token.symbol}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {formatPrice(token.price_usd || "0")}
                </span>
              </>
            ) : (
              <span style={{ color: "var(--color-text-secondary)" }}>
                {t("swap.select_token")}
              </span>
            )}
          </button>

          <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
            {(["above", "below"] as const).map((c) => (
              <button
                key={c}
                onClick={() => {
                  hapticImpact("light");
                  setCondition(c);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  background:
                    condition === c
                      ? c === "above"
                        ? "var(--color-accent-dim)"
                        : "var(--color-negative-dim)"
                      : "var(--color-bg-tertiary)",
                  border: `1px solid ${
                    condition === c
                      ? c === "above"
                        ? "var(--color-accent)"
                        : "var(--color-negative)"
                      : "var(--color-border)"
                  }`,
                  color:
                    condition === c
                      ? c === "above"
                        ? "var(--color-accent)"
                        : "var(--color-negative)"
                      : "var(--color-text-primary)",
                  fontWeight: 600,
                }}
              >
                {t(`alerts.${c}`)}
              </button>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
                marginBottom: 4,
              }}
            >
              {t("alerts.target_price")}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px var(--spacing-md)",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span style={{ color: "var(--color-text-tertiary)", marginRight: 4 }}>$</span>
              <input
                type="text"
                inputMode="decimal"
                value={targetPrice}
                onChange={(e) => handlePriceInput(e.target.value)}
                placeholder="0.00"
                style={{
                  flex: 1,
                  background: "transparent",
                  color: "var(--color-text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--font-size-lg)",
                }}
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!token || !targetPrice || parseFloat(targetPrice) <= 0}
            style={{
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              background:
                token && targetPrice && parseFloat(targetPrice) > 0
                  ? "var(--gradient-accent)"
                  : "var(--color-bg-tertiary)",
              color:
                token && targetPrice && parseFloat(targetPrice) > 0
                  ? "#0A0E14"
                  : "var(--color-text-tertiary)",
              fontWeight: 700,
              fontSize: "var(--font-size-md)",
              opacity: token && targetPrice ? 1 : 0.6,
            }}
          >
            {t("alerts.create")}
          </button>
        </div>
      </Sheet>
      <TokenSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(t) => {
          setToken(t);
          setSelectorOpen(false);
        }}
      />
    </>
  );
}
