import { create } from "zustand";

export interface PoolTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon_url: string | null;
  price_usd: string | null;
}

export interface PoolData {
  address: string;
  token_a: PoolTokenInfo;
  token_b: PoolTokenInfo;
  tvl_usd: number;
  volume_24h_usd: number;
  fee_rate: number;
  apr_24h: number;
  apr_7d: number;
  apr_30d: number;
  token_a_reserve: string;
  token_b_reserve: string;
  lp_total_supply: string;
  deprecated: boolean;
}

export interface LPPosition {
  pool_address: string;
  token_a: PoolTokenInfo;
  token_b: PoolTokenInfo;
  lp_balance: string;
  lp_total_supply: string;
  share_percent: number;
  token_a_amount: string;
  token_b_amount: string;
  value_usd: number;
  fees_earned_usd: number;
  apr_24h: number;
}

export interface SimulationRequest {
  pool_address?: string;
  token_a_address?: string;
  token_b_address?: string;
  provision_type: "balanced" | "custom" | "single";
  token_a_amount: string;
  token_b_amount: string;
  slippage: number;
  sender_address: string;
}

export interface SimulationResponse {
  expected_lp_tokens: string;
  share_of_pool: number;
  price_impact: number;
  value_usd: number;
  token_a_actual: string;
  token_b_actual: string;
}

export interface BuildTxResponse {
  messages: { address: string; amount: string; payload: string }[];
  valid_until: number;
}

export type SortBy = "tvl" | "apr" | "volume";
export type SortOrder = "desc" | "asc";

interface LiquidityState {
  pools: PoolData[];
  positions: LPPosition[];
  isLoadingPools: boolean;
  isLoadingPositions: boolean;
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  setPools: (pools: PoolData[]) => void;
  setPositions: (positions: LPPosition[]) => void;
  setLoadingPools: (loading: boolean) => void;
  setLoadingPositions: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  getFilteredPools: () => PoolData[];
  getSortedPools: () => PoolData[];
  getPositionForPool: (poolAddress: string) => LPPosition | undefined;
  getTotalPositionsValue: () => number;
  getTotalFeesEarned: () => number;
}

export const useLiquidityStore = create<LiquidityState>((set, get) => ({
  pools: [],
  positions: [],
  isLoadingPools: true,
  isLoadingPositions: false,
  searchQuery: "",
  sortBy: "tvl",
  sortOrder: "desc",

  setPools: (pools) => set({ pools, isLoadingPools: false }),
  setPositions: (positions) => set({ positions, isLoadingPositions: false }),
  setLoadingPools: (isLoadingPools) => set({ isLoadingPools }),
  setLoadingPositions: (isLoadingPositions) => set({ isLoadingPositions }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === "desc" ? "asc" : "desc",
    })),

  getFilteredPools: () => {
    const { pools, searchQuery } = get();
    if (!searchQuery.trim()) return pools.filter((p) => !p.deprecated);
    const q = searchQuery.toLowerCase();
    return pools.filter(
      (p) =>
        !p.deprecated &&
        (p.token_a.symbol.toLowerCase().includes(q) ||
          p.token_b.symbol.toLowerCase().includes(q) ||
          p.token_a.name.toLowerCase().includes(q) ||
          p.token_b.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q))
    );
  },

  getSortedPools: () => {
    const { sortBy, sortOrder } = get();
    const filtered = get().getFilteredPools();
    const sorted = [...filtered].sort((a, b) => {
      let valA: number;
      let valB: number;
      switch (sortBy) {
        case "tvl":
          valA = a.tvl_usd;
          valB = b.tvl_usd;
          break;
        case "apr":
          valA = a.apr_24h;
          valB = b.apr_24h;
          break;
        case "volume":
          valA = a.volume_24h_usd;
          valB = b.volume_24h_usd;
          break;
        default:
          valA = a.tvl_usd;
          valB = b.tvl_usd;
      }
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });
    return sorted;
  },

  getPositionForPool: (poolAddress) => {
    return get().positions.find((p) => p.pool_address === poolAddress);
  },

  getTotalPositionsValue: () => {
    return get().positions.reduce((sum, p) => sum + p.value_usd, 0);
  },

  getTotalFeesEarned: () => {
    return get().positions.reduce((sum, p) => sum + p.fees_earned_usd, 0);
  },
}));
