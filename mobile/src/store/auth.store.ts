import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import { AuthUser, UserRole } from '../types';
import { SECURE_KEYS } from '../api/client';
import axios from 'axios';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(username, password);

      await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, data.accessToken);
      if (data.refreshToken) {
        await SecureStore.setItemAsync(
          SECURE_KEYS.REFRESH_TOKEN,
          data.refreshToken,
        );
      }
      await SecureStore.setItemAsync(
        SECURE_KEYS.USER_DATA,
        JSON.stringify(data.user),
      );

      set({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      let message = 'Erro ao realizar login';

      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      set({
        isLoading: false,
        error: message,
        isAuthenticated: false,
      });

      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout API errors
    }
    await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_KEYS.USER_DATA);
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      const userRaw = await SecureStore.getItemAsync(SECURE_KEYS.USER_DATA);

      if (token && userRaw) {
        const user = JSON.parse(userRaw) as AuthUser;
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
