import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// ─── IP manual (preencha se a detecção automática falhar) ─────────────────────
// Descubra seu IP: no PC rode `ipconfig` (Windows) e copie o IPv4 da sua rede Wi-Fi
// Exemplo: const MANUAL_IP = '192.168.1.100';
const MANUAL_IP: string | null = '192.168.0.104';
// ─────────────────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (MANUAL_IP) {
    return `http://${MANUAL_IP}:3000`;
  }

  if (__DEV__) {
    // Expo SDK 49+: hostUri contém "IP:porta_expo", ex: "192.168.1.10:8081"
    const hostUri =
      Constants.expoConfig?.hostUri ??
      // fallback para SDKs mais antigos
      (Constants as any).manifest?.debuggerHost ??
      (Constants as any).manifest2?.extra?.expoClient?.hostUri;

    if (hostUri) {
      const host = hostUri.split(':')[0];
      const url = `http://${host}:3000`;
      console.log('[API] BASE_URL detectada automaticamente:', url);
      return url;
    }

    console.warn('[API] Não foi possível detectar o IP automaticamente. Defina MANUAL_IP no arquivo src/api/client.ts');
  }

  return 'https://sua-api-producao.com';
}

export const BASE_URL = getBaseUrl();

export const SECURE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: unwrap API envelope { ok, message, data } → data
// and handle 401 → refresh token
apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'ok' in payload) {
      if (payload.ok === false) {
        // Backend retornou HTTP 200 mas sinaliza erro no envelope
        const err: any = new Error(payload.message || 'Erro desconhecido');
        err.response = { status: response.status, data: payload };
        throw err;
      }
      if ('data' in payload) {
        response.data = payload.data;
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
        const accessToken_ = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${accessToken_}` } },
        );
        const { accessToken } = (response.data?.data ?? response.data) as { accessToken: string };
        await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, accessToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEYS.USER_DATA);
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
