import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";
import { authService } from "../services/authService";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  fetchCurrentUser: () => Promise<void>;
  setOnboarded: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token, refreshToken) => {
        localStorage.setItem("access_token", token);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updated) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updated } : null,
        })),

      fetchCurrentUser: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        try {
          set({ isLoading: true });
          const user = await authService.getMe();
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // Token expired or invalid
          authService.logout();
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      setOnboarded: (status) =>
        set((state) => ({
          user: state.user ? { ...state.user, is_onboarded: status } : null,
        })),
    }),
    {
      name: "food_recsys_auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
