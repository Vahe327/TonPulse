import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/layout/PageTransition";
import { PoolList } from "../components/liquidity/PoolList";
import { AIHelperBubble } from "../components/ai/AIHelperBubble";
import { PoolDetail } from "../components/liquidity/PoolDetail";
import { AddLiquidity } from "../components/liquidity/AddLiquidity";
import { CreatePool } from "../components/liquidity/CreatePool";
import { RemoveLiquidity } from "../components/liquidity/RemoveLiquidity";
import { MyPositions } from "../components/liquidity/MyPositions";
import { ImpermanentLossInfo } from "../components/liquidity/ImpermanentLossInfo";
import { PoolData, LPPosition, useLiquidityStore } from "../store/liquidityStore";
import { useLiquidity } from "../hooks/useLiquidity";
import { useTelegram } from "../hooks/useTelegram";
import { IoWarningOutline, IoAddCircleOutline } from "react-icons/io5";

type Tab = "pools" | "positions";

export function LiquidityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { address: poolAddressParam } = useParams<{ address: string }>();
  const { hapticSelection } = useTelegram();
  const { fetchPools, fetchPositions } = useLiquidity();

  const [activeTab, setActiveTab] = useState<Tab>("pools");
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [poolDetailOpen, setPoolDetailOpen] = useState(false);
  const [addLiquidityPool, setAddLiquidityPool] = useState<PoolData | null>(null);
  const [addLiquidityOpen, setAddLiquidityOpen] = useState(false);
  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const [removePosition, setRemovePosition] = useState<LPPosition | null>(null);
  const [removeLiquidityOpen, setRemoveLiquidityOpen] = useState(false);
  const [ilInfoOpen, setIlInfoOpen] = useState(false);

  const pools = useLiquidityStore((s) => s.pools);

  useEffect(() => {
    if (poolAddressParam && pools.length > 0) {
      const pool = pools.find((p) => p.address === decodeURIComponent(poolAddressParam));
      if (pool) {
        setSelectedPool(pool);
        setPoolDetailOpen(true);
      }
    }
  }, [poolAddressParam, pools]);

  const handleTabChange = (tab: Tab) => {
    hapticSelection();
    setActiveTab(tab);
  };

  const handleSelectPool = useCallback((pool: PoolData) => {
    setSelectedPool(pool);
    setPoolDetailOpen(true);
  }, []);

  const handleAddLiquidity = useCallback((pool: PoolData) => {
    setPoolDetailOpen(false);
    setAddLiquidityPool(pool);
    setAddLiquidityOpen(true);
  }, []);

  const handleAddMore = useCallback(
    (position: LPPosition) => {
      const pool = pools.find((p) => p.address === position.pool_address);
      if (pool) {
        setAddLiquidityPool(pool);
        setAddLiquidityOpen(true);
      }
    },
    [pools]
  );

  const handleRemove = useCallback((position: LPPosition) => {
    setRemovePosition(position);
    setRemoveLiquidityOpen(true);
  }, []);

  const handleLiquiditySuccess = useCallback(() => {
    fetchPools();
    fetchPositions();
  }, [fetchPools, fetchPositions]);

  const tabs: { key: Tab; labelKey: string }[] = [
    { key: "pools", labelKey: "liquidity.tab_all_pools" },
    { key: "positions", labelKey: "liquidity.tab_my_positions" },
  ];

  return (
    <PageTransition>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "0 var(--spacing-md)",
          paddingBottom: "calc(var(--bottom-nav-height) + var(--spacing-md))",
          gap: "var(--spacing-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "var(--spacing-md)",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {t("liquidity.title")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                hapticSelection();
                setCreatePoolOpen(true);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-accent-dim)",
                border: "none",
                fontSize: "var(--font-size-xs)",
                fontWeight: 600,
                color: "var(--color-accent)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <IoAddCircleOutline size={14} />
              {t("liquidity.create_pool")}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                hapticSelection();
                setIlInfoOpen(true);
              }}
              style={{
                padding: "6px 10px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-warning-dim)",
                border: "none",
                fontSize: "var(--font-size-xs)",
                fontWeight: 600,
                color: "var(--color-warning)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <IoWarningOutline size={14} />
              {t("liquidity.il_badge")}
            </motion.button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: "var(--color-bg-card)",
            backdropFilter: "blur(var(--blur-md))",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            padding: 3,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-xs)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                  color: isActive
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
                  background: isActive
                    ? "var(--color-bg-tertiary)"
                    : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition:
                    "background var(--duration-fast) ease, color var(--duration-fast) ease",
                  position: "relative",
                }}
              >
                {t(tab.labelKey)}
                {isActive && (
                  <motion.div
                    layoutId="liquidity-tab-indicator"
                    style={{
                      position: "absolute",
                      bottom: -3,
                      left: "30%",
                      right: "30%",
                      height: 2,
                      borderRadius: 1,
                      background: "var(--color-accent)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {activeTab === "pools" && <PoolList onSelectPool={handleSelectPool} />}

        {activeTab === "positions" && (
          <MyPositions onAddMore={handleAddMore} onRemove={handleRemove} />
        )}
      </div>

      <PoolDetail
        pool={selectedPool}
        isOpen={poolDetailOpen}
        onClose={() => setPoolDetailOpen(false)}
        onAddLiquidity={handleAddLiquidity}
      />

      <AddLiquidity
        pool={addLiquidityPool}
        isOpen={addLiquidityOpen}
        onClose={() => setAddLiquidityOpen(false)}
        onSuccess={handleLiquiditySuccess}
      />

      <CreatePool
        isOpen={createPoolOpen}
        onClose={() => setCreatePoolOpen(false)}
        onSuccess={handleLiquiditySuccess}
      />

      <RemoveLiquidity
        position={removePosition}
        isOpen={removeLiquidityOpen}
        onClose={() => setRemoveLiquidityOpen(false)}
        onSuccess={handleLiquiditySuccess}
      />

      <ImpermanentLossInfo
        isOpen={ilInfoOpen}
        onClose={() => setIlInfoOpen(false)}
      />

    </PageTransition>
  );
}
