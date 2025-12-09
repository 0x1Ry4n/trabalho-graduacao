import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'theme_mode';

interface ThemeStore {
  mode: 'light' | 'dark';
  isLoading: boolean;
  toggleTheme: () => Promise<void>;
  setMode: (mode: 'light' | 'dark') => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'light',
  isLoading: true,

  loadFromStorage: async () => {
    try {
      const stored = await SecureStore.getItemAsync(THEME_KEY);
      if (stored === 'light' || stored === 'dark') {
        set({ mode: stored });
      }
    } catch {
      // default to light
    } finally {
      set({ isLoading: false });
    }
  },

  setMode: async (mode) => {
    set({ mode });
    try {
      await SecureStore.setItemAsync(THEME_KEY, mode);
    } catch {
      // ignore persistence error
    }
  },

  toggleTheme: async () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    await get().setMode(next);
  },
}));
