/**
 * Fachada do cliente HTTP.
 *
 * A implementação vive em `src/api/http/`; este arquivo existe para manter
 * estável o ponto de importação já usado pelos 16 módulos de `src/api/*`,
 * por `src/store/auth.store.ts` e pelas telas administrativas.
 *
 * Estrutura:
 * - `http/config.ts`       resolução da URL base e timeouts
 * - `http/envelope.ts`     tipos do envelope de resposta do backend
 * - `http/errors.ts`       ApiError compatível com `axios.isAxiosError`
 * - `http/tokenStorage.ts` acesso único aos tokens no SecureStore
 * - `http/authEvents.ts`   sinalização de sessão expirada
 * - `http/interceptors.ts` anexação de JWT, refresh e desempacotamento
 */

import apiClient from './http';

export { BASE_URL, DEFAULT_TIMEOUT, UPLOAD_TIMEOUT } from './http/config';
export { SECURE_KEYS, tokenStorage } from './http/tokenStorage';
export { authEvents } from './http/authEvents';
export { ApiError, isNetworkError } from './http/errors';
export type { ApiErrorBody } from './http/errors';
export type {
    ApiEnvelope,
    FieldErrors,
    PaginationMeta,
} from './http/envelope';

export default apiClient;
