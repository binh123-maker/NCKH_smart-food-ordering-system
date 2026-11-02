import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserPreference } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  setOnboarded: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: "usr-demo",
        email: "nguyenvana@gmail.com",
        full_name: "Nguyễn Văn A",
        phone: "0901234567",
        role: "CUSTOMER",
        is_active: true,
        is_onboarded: true,
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      },
      token: "mock-jwt-token-for-development",
      isAuthenticated: true,
      login: (user, token) => {
        localStorage.setItem("access_token", token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updated) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updated } : null,
        })),
      setOnboarded: (status) =>
        set((state) => ({
          user: state.user ? { ...state.user, is_onboarded: status } : null,
        })),
    }),
    {
      name: "food_recsys_auth",
    }
  )
);

