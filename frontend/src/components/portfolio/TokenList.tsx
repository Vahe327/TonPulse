import { useTranslation } from "react-i18next";
import { TokenRow } from "./TokenRow";

interface Position {
  token_address: string;
  token_symbol: string;
  token_name: string;
  icon_url: string | null;
  balance_formatted: string;
  value_usd: string;
  price_usd: string;
  change_24h: string | null;
  portfolio_share: string;
}

interface TokenListProps {
  positions: Position[];
}

export function TokenList({ positions }: TokenListProps) {
  const { t } = useTranslation();

  if (positions.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "var(--spacing-xxl) var(--spacing-md)",
          color: "var(--color-text-tertiary)",
        }}
      >
        {t("portfolio.no_tokens")}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          padding: "var(--spacing-md) var(--spacing-md) var(--spacing-sm)",
          fontSize: "var(--font-size-sm)",
          fontWeight: 600,
          color: "var(--color-text-secondary)",
        }}
      >
        {t("portfolio.your_tokens")}
      </div>
      {positions.map((pos, i) => (
        <TokenRow
          key={pos.token_address}
          address={pos.token_address}
          symbol={pos.token_symbol}
          name={pos.token_name}
          iconUrl={pos.icon_url}
          balanceFormatted={pos.balance_formatted}
          valueUsd={pos.value_usd}
          priceUsd={pos.price_usd}
          change24h={pos.change_24h}
          portfolioShare={pos.portfolio_share}
          index={i}
        />
      ))}
    </div>
  );
}
