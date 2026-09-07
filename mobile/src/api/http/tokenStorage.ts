import * as SecureStore from 'expo-secure-store';

/**
 * Chaves do SecureStore.
 *
 * Exportadas (e re-exportadas por `src/api/client.ts`) porque
 * `src/store/auth.store.ts` e as telas de upload já as consomem.
 */
export const SECURE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
} as const;

/**
 * Camada única de acesso aos tokens.
 *
 * O access token é mantido em memória além do SecureStore: o interceptor de
 * request precisa dele em toda chamada, e cada `getItemAsync` é uma chamada
 * nativa (Keychain no iOS, Keystore no Android). O cache é invalidado no
 * refresh e na limpeza da sessão, então nunca serve um token obsoleto.
 *
 * O refresh token não é cacheado: é usado raramente e é o segredo de maior
 * valor — mantê-lo fora da memória do JS reduz a superfície de exposição.
 */
let accessTokenCache: string | null | undefined;

export const tokenStorage = {
    async getAccessToken(): Promise<string | null> {
        if (accessTokenCache !== undefined) {
            return accessTokenCache;
        }

        accessTokenCache = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
        return accessTokenCache;
    },

    async setAccessToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, token);
        accessTokenCache = token;
    },

    getRefreshToken(): Promise<string | null> {
        return SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    },

    /**
     * Remove todo o material de sessão. Usado no logout e quando o refresh
     * falha em definitivo.
     */
    async clearSession(): Promise<void> {
        accessTokenCache = null;

        await Promise.all([
            SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
            SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
            SecureStore.deleteItemAsync(SECURE_KEYS.USER_DATA),
        ]);
    },

    /**
     * Descarta o cache em memória sem tocar no SecureStore.
     *
     * Necessário porque `auth.store.ts` grava os tokens diretamente no
     * SecureStore no login; sem esta invalidação o interceptor continuaria
     * enviando o token do usuário anterior.
     */
    invalidateCache(): void {
        accessTokenCache = undefined;
    },
};
