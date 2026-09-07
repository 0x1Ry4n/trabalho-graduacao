import apiClient, { tokenStorage } from './client';
import { LoginResponse } from '../types';

export const authApi = {
  /**
   * Autentica o usuário.
   *
   * `_skipAuth` evita anexar um token de sessão anterior à requisição de login.
   * Erros sobem como `AxiosError` para serem tratados por quem chamou — a
   * versão anterior os convertia em `Error` genérico, descartando status HTTP
   * e erros de validação por campo.
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      { email: username, password },
      { _skipAuth: true },
    );

    return response.data;
  },

  /**
   * Renova o access token.
   *
   * O refresh automático é feito pelo interceptor
   * (`src/api/http/interceptors.ts`); este método existe para renovação
   * explícita. O backend identifica o usuário pelo próprio refresh token.
   */
  refresh: async (): Promise<{ accessToken: string }> => {
    const refreshToken = await tokenStorage.getRefreshToken();

    const response = await apiClient.post<{ accessToken: string }>(
      '/auth/refresh',
      { refreshToken },
      { _skipAuth: true },
    );

    return response.data;
  },

  /**
   * Encerra a sessão no servidor.
   *
   * O refresh token vai no corpo: clientes nativos não usam cookies, e sem ele
   * o backend não tinha como identificar qual sessão remover — a linha ficava
   * no banco até expirar.
   */
  logout: async (): Promise<void> => {
    const refreshToken = await tokenStorage.getRefreshToken();

    await apiClient.post('/auth/logout', { refreshToken });
  },
};
