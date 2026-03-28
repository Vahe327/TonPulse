import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { IoWallet, IoWaterOutline } from "react-icons/io5";
import { useLiquidityStore, LPPosition } from "../../store/liquidityStore";
import { useTelegram } from "../../hooks/useTelegram";
import { Skeleton } from "../common/Skeleton";
import { PositionCard } from "./PositionCard";
import { formatLargeNumber } from "../../utils/format";

interface MyPositionsProps {
  onAddMore: (position: LPPosition) => void;
  onRemove: (position: LPPosition) => void;
}

export function MyPositions({ onAddMore, onRemove }: MyPositionsProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { positions, isLoadingPositions, getTotalPositionsValue, getTotalFeesEarned } =
    useLiquidityStore();

  const handleConnect = () => {
    hapticImpact("medium");
    tonConnectUI.openModal();
  };

  if (!walletAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--spacing-xxl) var(--spacing-md)",
          gap: "var(--spacing-md)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-purple-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IoWallet size={48} />
        </div>
        <div
          style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            textAlign: "center",
          }}
        >
          {t("liquidity.connect_to_view")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-tertiary)",
            textAlign: "center",
            maxWidth: 260,
            lineHeight: 1.5,
          }}
        >
          {t("liquidity.connect_to_view_desc")}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConnect}
          style={{
            marginTop: "var(--spacing-sm)",
            padding: "14px 32px",
            borderRadius: "var(--radius-sm)",
            background: "var(--gradient-accent)",
            border: "none",
            fontSize: "var(--font-size-md)",
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            color: "var(--color-bg-primary)",
            cursor: "pointer",
            boxShadow: "var(--shadow-glow-accent)",
          }}
        >
          {t("liquidity.connect_wallet")}
        </motion.button>
      </motion.div>
    );
  }

  if (isLoadingPositions) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-md) 0",
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: "var(--spacing-md)",
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-md)",
              }}
            >
              <Skeleton
                width={63}
                height={36}
                borderRadius="var(--radius-full)"
              />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <Skeleton width="50%" height={16} />
                <Skeleton width="30%" height={12} />
              </div>
              <Skeleton width={70} height={20} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--spacing-sm)",
              }}
            >
              <Skeleton height={48} borderRadius="var(--radius-xs)" />
              <Skeleton height={48} borderRadius="var(--radius-xs)" />
            </div>
            <Skeleton height={36} borderRadius="var(--radius-xs)" />
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-sm)",
              }}
            >
              <Skeleton height={44} borderRadius="var(--radius-sm)" />
              <Skeleton height={44} borderRadius="var(--radius-sm)" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--spacing-xxl) var(--spacing-md)",
          gap: "var(--spacing-md)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-bg-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IoWaterOutline size={48} />
        </div>
        <div
          style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            textAlign: "center",
          }}
        >
          {t("liquidity.no_positions")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-tertiary)",
            textAlign: "center",
            maxWidth: 280,
            lineHeight: 1.5,
          }}
        >
          {t("liquidity.no_positions_desc")}
        </div>
      </motion.div>
    );
  }

  const totalValue = getTotalPositionsValue();
  const totalFees = getTotalFeesEarned();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "var(--spacing-lg) var(--spacing-md)",
          background: "var(--gradient-card)",
          backdropFilter: "blur(var(--blur-md))",
          WebkitBackdropFilter: "blur(var(--blur-md))",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--spacing-sm)",
        }}
      >
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            fontWeight: 500,
            color: "var(--color-text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          {t("liquidity.total_value")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-display)",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-primary)",
            lineHeight: 1,
          }}
        >
          {formatLargeNumber(totalValue)}
        </div>
        {totalFees > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-accent-dim)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: "var(--color-accent)",
            }}
          >
            {t("liquidity.total_fees")}: +{formatLargeNumber(totalFees)}
          </div>
        )}
      </motion.div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
        }}
      >
        {positions.map((position, index) => (
          <PositionCard
            key={position.pool_address}
            position={position}
            index={index}
            onAddMore={onAddMore}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
