/**
 * Contrato de resposta do backend.
 *
 * Toda resposta da API vem embrulhada por `SendResponse` (backend
 * `src/shared/utils/response.utils.ts`) no formato:
 *
 *     { ok: boolean, message: string, data?: T, pagination?: PaginationMeta, errors?: {...} }
 *
 * O interceptor de resposta desembrulha esse envelope para que as camadas
 * acima recebam apenas o payload útil.
 */

import type { PaginationMeta } from '../../types';

export type { PaginationMeta };

/** Erros de validação por campo: `{ email: ['formato inválido'] }`. */
export type FieldErrors = Record<string, string[]>;

export interface ApiEnvelope<T = unknown> {
    ok: boolean;
    message: string;
    data?: T;
    pagination?: PaginationMeta;
    errors?: FieldErrors;
}

/**
 * Identifica o envelope sem recorrer a `any`.
 *
 * A checagem exige `ok` booleano — um payload que apenas por acaso tenha uma
 * chave `ok` de outro tipo não é tratado como envelope.
 */
export function isApiEnvelope(value: unknown): value is ApiEnvelope {
    return (
        typeof value === 'object' &&
        value !== null &&
        'ok' in value &&
        typeof (value as { ok: unknown }).ok === 'boolean'
    );
}

export function hasPagination(
    envelope: ApiEnvelope,
): envelope is ApiEnvelope & { pagination: PaginationMeta } {
    return (
        typeof envelope.pagination === 'object' &&
        envelope.pagination !== null
    );
}
