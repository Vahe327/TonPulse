import { create } from "zustand";

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon_url: string | null;
  price_usd: string | null;
  price_ton: string | null;
  change_24h: string | null;
  volume_24h: string | null;
  liquidity: string | null;
  market_cap: string | null;
  is_verified: boolean;
}

interface TokenState {
  tokens: TokenData[];
  isLoading: boolean;
  searchQuery: string;
  setTokens: (tokens: TokenData[]) => void;
  mergeTokens: (tokens: TokenData[]) => void;
  updateTokenPrice: (address: string, price: string, change24h: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  getFilteredTokens: () => TokenData[];
}

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: [],
  isLoading: true,
  searchQuery: "",
  setTokens: (tokens) => set({ tokens, isLoading: false }),
  mergeTokens: (incoming) => {
    const { tokens: existing } = get();
    if (existing.length === 0) {
      set({ tokens: incoming, isLoading: false });
      return;
    }

    const existingMap = new Map(existing.map((t) => [t.address, t]));
    let changed = false;
    const merged = incoming.map((newToken) => {
      const old = existingMap.get(newToken.address);
      if (!old) {
        changed = true;
        return newToken;
      }
      if (
        old.price_usd === newToken.price_usd &&
        old.change_24h === newToken.change_24h &&
        old.liquidity === newToken.liquidity &&
        old.volume_24h === newToken.volume_24h &&
        old.icon_url === newToken.icon_url &&
        old.is_verified === newToken.is_verified
      ) {
        return old;
      }
      changed = true;
      return newToken;
    });

    if (changed || merged.length !== existing.length) {
      set({ tokens: merged, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
  updateTokenPrice: (address, price, change24h) => {
    const { tokens } = get();
    const idx = tokens.findIndex((t) => t.address === address);
    if (idx === -1) return;
    const token = tokens[idx];
    if (token.price_usd === price && (change24h === null || token.change_24h === change24h)) return;
    const updated = [...tokens];
    updated[idx] = { ...token, price_usd: price, change_24h: change24h ?? token.change_24h };
    set({ tokens: updated });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  getFilteredTokens: () => {
    const { tokens, searchQuery } = get();
    if (!searchQuery.trim()) return tokens;
    const q = searchQuery.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  },
}));
