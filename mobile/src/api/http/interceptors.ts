import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import { BASE_URL, DEFAULT_TIMEOUT } from './config';
import { ApiEnvelope, hasPagination, isApiEnvelope } from './envelope';
import { fromFailedEnvelope, withFieldErrors } from './errors';
import { authEvents } from './authEvents';
import { tokenStorage } from './tokenStorage';

/**
 * Flags internas de controle da requisição.
 *
 * Declaradas via module augmentation para eliminar os casts
 * `config as InternalAxiosRequestConfig & { _retry?: boolean }` espalhados
 * pela versão anterior.
 */
declare module 'axios' {
    export interface AxiosRequestConfig {
        /** Marca a requisição como já reenviada após um refresh. */
        _retry?: boolean;
        /** Suprime o header Authorization (usado pelo login). */
        _skipAuth?: boolean;
    }
}

const REFRESH_PATH = '/auth/refresh';
const LOGIN_PATH = '/auth/login';

/**
 * Instância isolada, sem interceptors, para a chamada de refresh.
 *
 * Usar o `apiClient` aqui criaria recursão: um 401 no próprio refresh
 * dispararia outro refresh.
 */
const refreshClient = axios.create({
    baseURL: BASE_URL,
    timeout: DEFAULT_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
});

interface QueuedRequest {
    resolve: (token: string) => void;
    reject: (reason: unknown) => void;
}

let isRefreshing = false;
let pendingQueue: QueuedRequest[] = [];

/**
 * Libera as requisições que ficaram esperando o refresh.
 *
 * A fila resolve com o **token**, não com a promessa da requisição reenviada:
 * a versão anterior declarava `resolve: (value: string) => void` mas passava
 * `apiClient(originalRequest)` — uma AxiosPromise — para dentro dele.
 */
function drainQueue(error: unknown, token: string | null): void {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (token) {
            resolve(token);
        } else {
            reject(error);
        }
    });

    pendingQueue = [];
}

/**
 * Obtém um novo access token.
 *
 * O backend responde `{ ok, message, data: { accessToken, user } }`; como o
 * `refreshClient` não tem interceptors, o envelope é desembrulhado aqui.
 */
async function requestNewAccessToken(): Promise<string> {
    const refreshToken = await tokenStorage.getRefreshToken();

    if (!refreshToken) {
        throw new Error('Nenhum refresh token armazenado');
    }

    const response = await refreshClient.post<ApiEnvelope<{ accessToken: string }>>(
        REFRESH_PATH,
        { refreshToken },
    );

    const accessToken = response.data?.data?.accessToken;

    if (typeof accessToken !== 'string' || accessToken.length === 0) {
        throw new Error('Resposta de refresh sem accessToken');
    }

    return accessToken;
}

/** Encerra a sessão e avisa a camada de estado. */
async function terminateSession(): Promise<void> {
    await tokenStorage.clearSession();
    authEvents.emit('session:expired');
}

function attachRequestInterceptor(instance: AxiosInstance): void {
    instance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
            // O login não deve carregar o token antigo: enviar credenciais de
            // uma sessão anterior junto de novas é desnecessário e expõe o token.
            if (config._skipAuth || config.url?.includes(LOGIN_PATH)) {
                return config;
            }

            const token = await tokenStorage.getAccessToken();

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },
        (error: unknown) => Promise.reject(error),
    );
}

function attachResponseInterceptor(instance: AxiosInstance): void {
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            const payload: unknown = response.data;

            if (!isApiEnvelope(payload)) {
                return response;
            }

            if (payload.ok === false) {
                // HTTP 2xx com erro sinalizado no corpo.
                throw fromFailedEnvelope(payload, response);
            }

            // Respostas paginadas preservam os metadados. A versão anterior
            // fazia `response.data = payload.data`, descartando `pagination` —
            // por isso `PaginatedResponse` nunca chegava completo às telas.
            response.data = hasPagination(payload)
                ? { data: payload.data ?? [], pagination: payload.pagination }
                : payload.data;

            return response;
        },
        async (error: AxiosError) => {
            const originalRequest = error.config;

            const shouldAttemptRefresh =
                error.response?.status === 401 &&
                originalRequest !== undefined &&
                !originalRequest._retry &&
                !originalRequest.url?.includes(REFRESH_PATH) &&
                !originalRequest.url?.includes(LOGIN_PATH);

            if (!shouldAttemptRefresh || !originalRequest) {
                return Promise.reject(withFieldErrors(error));
            }

            // Um refresh já está em curso: entra na fila e reenvia quando o
            // novo token chegar. O `_retry` é marcado também aqui — sem isso a
            // requisição reenfileirada podia reentrar no fluxo de refresh.
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest._retry = true;
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return instance(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const accessToken = await requestNewAccessToken();

                await tokenStorage.setAccessToken(accessToken);
                drainQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return await instance(originalRequest);
            } catch (refreshError) {
                drainQueue(refreshError, null);
                await terminateSession();

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        },
    );
}

export function attachInterceptors(instance: AxiosInstance): AxiosInstance {
    attachRequestInterceptor(instance);
    attachResponseInterceptor(instance);

    return instance;
}
