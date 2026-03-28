import { useCallback, useEffect, useRef } from "react";
import { useTonAddress } from "@tonconnect/ui-react";
import { api } from "../services/api";
import {
  useLiquidityStore,
  PoolData,
  LPPosition,
  SimulationRequest,
  SimulationResponse,
  BuildTxResponse,
} from "../store/liquidityStore";

export function useLiquidity() {
  const walletAddress = useTonAddress();
  const pools = useLiquidityStore((s) => s.pools);
  const positions = useLiquidityStore((s) => s.positions);
  const isLoadingPools = useLiquidityStore((s) => s.isLoadingPools);
  const isLoadingPositions = useLiquidityStore((s) => s.isLoadingPositions);
  const searchQuery = useLiquidityStore((s) => s.searchQuery);
  const sortBy = useLiquidityStore((s) => s.sortBy);
  const sortOrder = useLiquidityStore((s) => s.sortOrder);
  const setPools = useLiquidityStore((s) => s.setPools);
  const setPositions = useLiquidityStore((s) => s.setPositions);
  const setLoadingPools = useLiquidityStore((s) => s.setLoadingPools);
  const setLoadingPositions = useLiquidityStore((s) => s.setLoadingPositions);
  const setSearchQuery = useLiquidityStore((s) => s.setSearchQuery);
  const setSortBy = useLiquidityStore((s) => s.setSortBy);

  const fetchingPoolsRef = useRef(false);
  const fetchingPositionsRef = useRef(false);
  const initializedRef = useRef(false);

  const fetchPools = useCallback(async () => {
    if (fetchingPoolsRef.current) return;
    fetchingPoolsRef.current = true;
    setLoadingPools(true);
    try {
      const { searchQuery: sq, sortBy: sb, sortOrder: so } = useLiquidityStore.getState();
      const params = new URLSearchParams();
      if (sq.trim()) params.set("search", sq.trim());
      params.set("sort_by", sb);
      params.set("sort_order", so);
      params.set("limit", "50");
      const endpoint = `/pools?${params.toString()}`;
      const result = await api.get<{ pools: PoolData[] }>(endpoint);
      setPools(result.pools);
    } catch {
      setPools([]);
    } finally {
      fetchingPoolsRef.current = false;
      setLoadingPools(false);
    }
  }, [setPools, setLoadingPools]);

  const fetchPositions = useCallback(async () => {
    if (!walletAddress || fetchingPositionsRef.current) return;
    fetchingPositionsRef.current = true;
    setLoadingPositions(true);
    try {
      const result = await api.get<{ positions: LPPosition[] }>(
        `/liquidity/positions?wallet=${encodeURIComponent(walletAddress)}`
      );
      setPositions(result.positions);
    } catch {
      setPositions([]);
    } finally {
      fetchingPositionsRef.current = false;
      setLoadingPositions(false);
    }
  }, [walletAddress, setPositions, setLoadingPositions]);

  const simulateProvision = useCallback(
    async (request: SimulationRequest): Promise<SimulationResponse | null> => {
      try {
        return await api.post<SimulationResponse>("/liquidity/simulate", request);
      } catch {
        return null;
      }
    },
    []
  );

  const buildProvisionTransaction = useCallback(
    async (request: SimulationRequest): Promise<BuildTxResponse | null> => {
      try {
        return await api.post<BuildTxResponse>("/liquidity/build-transaction", request);
      } catch {
        return null;
      }
    },
    []
  );

  const buildRemoveTransaction = useCallback(
    async (params: {
      pool_address: string;
      lp_amount: string;
      slippage: number;
      sender_address: string;
    }): Promise<BuildTxResponse | null> => {
      try {
        return await api.post<BuildTxResponse>("/liquidity/build-refund-transaction", params);
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchPools();
    }
  }, [fetchPools]);

  useEffect(() => {
    if (walletAddress) {
      fetchPositions();
    }
  }, [walletAddress, fetchPositions]);

  return {
    pools,
    positions,
    isLoadingPools,
    isLoadingPositions,
    searchQuery,
    sortBy,
    sortOrder,
    setSearchQuery,
    setSortBy,
    fetchPools,
    fetchPositions,
    simulateProvision,
    buildProvisionTransaction,
    buildRemoveTransaction,
    walletConnected: !!walletAddress,
    walletAddress,
  };
}
