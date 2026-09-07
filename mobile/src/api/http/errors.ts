import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiEnvelope, FieldErrors, isApiEnvelope } from './envelope';

/**
 * Corpo de erro devolvido pelo backend. É o próprio envelope com `ok: false`.
 */
export type ApiErrorBody = ApiEnvelope<never>;

/**
 * Erro de API tipado.
 *
 * Estende `AxiosError` — e não `Error` — de propósito: o restante do app
 * discrimina erros com `axios.isAxiosError()` (`src/api/auth.ts`,
 * `src/api/students.ts`, `src/store/auth.store.ts`). A versão anterior lançava
 * um `Error` comum com uma propriedade `.response` colada à mão para o caso de
 * envelope `ok: false` com HTTP 200; `isAxiosError()` retornava `false` para
 * esse objeto e o erro escapava de todo o tratamento existente.
 */
export class ApiError<T = ApiErrorBody> extends AxiosError<T> {
    /** Erros de validação por campo, quando o backend os fornece. */
    readonly fieldErrors: FieldErrors;

    constructor(
        message: string,
        code: string | undefined,
        config: InternalAxiosRequestConfig | undefined,
        response: AxiosResponse<T> | undefined,
        fieldErrors: FieldErrors = {},
    ) {
        super(message, code, config, response?.request, response);
        this.name = 'ApiError';
        this.fieldErrors = fieldErrors;
    }

    // `status` e herdado de AxiosError: o construtor da classe base ja o
    // preenche a partir de `response.status`.
}

/**
 * Converte um envelope com `ok: false` (mas HTTP 2xx) em um erro que passa por
 * `axios.isAxiosError`, preservando status, mensagem e erros de campo.
 */
export function fromFailedEnvelope(
    envelope: ApiEnvelope,
    response: AxiosResponse,
): ApiError {
    return new ApiError(
        envelope.message || 'Erro desconhecido',
        AxiosError.ERR_BAD_RESPONSE,
        response.config,
        response as AxiosResponse<ApiErrorBody>,
        envelope.errors ?? {},
    );
}

/**
 * Enriquece um `AxiosError` de resposta HTTP de erro (4xx/5xx) com os erros de
 * campo do envelope, mantendo a instância original intacta para quem já
 * inspeciona `error.response`.
 */
export function withFieldErrors(error: AxiosError): AxiosError {
    const body = error.response?.data;

    if (isApiEnvelope(body) && body.errors) {
        return new ApiError(
            body.message || error.message,
            error.code,
            error.config,
            error.response as AxiosResponse<ApiErrorBody>,
            body.errors,
        );
    }

    return error;
}

/** Erro de rede (sem resposta do servidor) — offline, DNS, timeout. */
export function isNetworkError(error: unknown): boolean {
    return (
        error instanceof AxiosError &&
        !error.response &&
        (error.code === AxiosError.ERR_NETWORK ||
            error.code === AxiosError.ECONNABORTED ||
            error.code === AxiosError.ETIMEDOUT)
    );
}
