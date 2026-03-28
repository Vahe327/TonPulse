import { create } from "zustand";

interface UserData {
  id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  wallet_address: string | null;
  language: string;
  default_slippage: number;
}

interface UserState {
  user: UserData | null;
  isLoading: boolean;
  setUser: (user: UserData) => void;
  updateUser: (partial: Partial<UserData>) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
