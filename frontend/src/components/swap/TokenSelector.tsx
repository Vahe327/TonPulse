import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "../common/Sheet";
import { TokenIcon } from "../common/TokenIcon";
import { formatPrice } from "../../utils/format";
import { useTokenStore, TokenData } from "../../store/tokenStore";
import { api } from "../../services/api";

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenData) => void;
  excludeAddress?: string;
  filterByPairWith?: string;
  balanceMap?: Record<string, string>;
}

export function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  excludeAddress,
  filterByPairWith,
  balanceMap = {},
}: TokenSelectorProps) {
  const { t } = useTranslation();
  const tokens = useTokenStore((s) => s.tokens);
  const [query, setQuery] = useState("");
  const [pairAddresses, setPairAddresses] = useState<Set<string> | null>(null);
  const [loadingPairs, setLoadingPairs] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
    if (!filterByPairWith) {
      setPairAddresses(null);
      return;
    }
    setLoadingPairs(true);
    api
      .get<{ pairs: string[] }>(`/swap/pairs?token=${encodeURIComponent(filterByPairWith)}`)
      .then((data) => setPairAddresses(new Set(data.pairs)))
      .catch(() => setPairAddresses(null))
      .finally(() => setLoadingPairs(false));
  }, [isOpen, filterByPairWith]);

  const filtered = useMemo(() => {
    const hasQuery = query.trim().length > 0;
    const q = query.toLowerCase();

    let list = tokens.filter((tk) => {
      if (tk.address === excludeAddress) return false;
      if (pairAddresses && !pairAddresses.has(tk.address)) return false;
      if (hasQuery) {
        return (
          tk.symbol.toLowerCase().includes(q) ||
          tk.name.toLowerCase().includes(q) ||
          tk.address.toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      const balA = balanceMap[a.address] ? parseFloat(balanceMap[a.address]) : 0;
      const balB = balanceMap[b.address] ? parseFloat(balanceMap[b.address]) : 0;
      if (balA > 0 && balB <= 0) return -1;
      if (balB > 0 && balA <= 0) return 1;
      return 0;
    });

    return list;
  }, [tokens, excludeAddress, pairAddresses, query, balanceMap]);

  const handleSelect = (token: TokenData) => {
    onSelect(token);
    onClose();
    setQuery("");
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={t("swap.select_token")}>
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("market.search") + " / contract"}
          style={{
            width: "100%",
            padding: "12px var(--spacing-md)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            fontSize: "var(--font-size-md)",
          }}
        />
      </div>
      <div style={{ maxHeight: "50vh", overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {loadingPairs ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-xl)", color: "var(--color-text-tertiary)" }}>
            {t("common.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-xl)", color: "var(--color-text-tertiary)" }}>
            {t("market.no_results")}
          </div>
        ) : (
          filtered.map((token, i) => {
            const bal = balanceMap[token.address];
            return (
              <button
                key={`${token.address}-${i}`}
                onClick={() => handleSelect(token)}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--spacing-sm)",
                  padding: "10px var(--spacing-sm)", borderRadius: "var(--radius-sm)",
                  background: bal ? "rgba(0,212,170,0.04)" : "transparent",
                  width: "100%", textAlign: "left",
                }}
              >
                <TokenIcon src={token.icon_url} symbol={token.symbol} size={36} address={token.address} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-md)" }}>{token.symbol}</div>
                  <div style={{
                    fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {token.name}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {bal && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--color-accent)", marginBottom: 2 }}>
                      {bal}
                    </div>
                  )}
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                    {formatPrice(token.price_usd || "0")}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Sheet>
  );
}
