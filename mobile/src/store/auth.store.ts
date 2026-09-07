import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { authApi } from '../api/auth';
import { AuthUser } from '../types';
import { SECURE_KEYS, authEvents, tokenStorage } from '../api/client';

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
  /** Limpa o estado quando o servidor invalida a sessão. */
  handleSessionExpired: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(username, password);

      // Via tokenStorage, e não SecureStore direto: a gravação precisa
      // invalidar o cache em memória usado pelo interceptor de request.
      await tokenStorage.setAccessToken(data.accessToken);

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
      // Falha ao avisar o servidor não pode impedir o logout local.
    }
    await tokenStorage.clearSession();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      // Descarta qualquer token cacheado de uma sessão anterior do processo.
      tokenStorage.invalidateCache();

      const token = await tokenStorage.getAccessToken();
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

  handleSessionExpired: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Sessão expirada. Faça login novamente.',
    }),
}));

/**
 * Ponte entre a camada de API e a de estado.
 *
 * O interceptor emite `session:expired` quando o refresh falha em definitivo;
 * o store apenas limpa o estado. A navegação é responsabilidade da UI
 * (`app/_layout.tsx`), mantendo a separação exigida por `.claude/rules.md` —
 * a versão anterior chamava `router.replace` de dentro do interceptor.
 *
 * Os tokens já foram apagados pelo interceptor antes da emissão.
 */
authEvents.on('session:expired', () => {
  useAuthStore.getState().handleSessionExpired();
});
