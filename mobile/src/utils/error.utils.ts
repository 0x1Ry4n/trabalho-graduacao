import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { ApiError as ApiErrorClass, isNetworkError } from '../api/client';
import type { ApiErrorBody, FieldErrors } from '../api/client';

/**
 * Formato aceito pelos utilitários de erro.
 *
 * As funções aceitam `unknown` e fazem a discriminação internamente — antes
 * havia uma interface `ApiError` local com `data?: any` que duplicava (mal) os
 * tipos do axios e obrigava casts `error as ApiError` em toda tela.
 *
 * @deprecated Mantido apenas para compatibilidade dos casts existentes.
 * Passe o erro direto: as funções já lidam com `unknown`.
 */
export type ApiError = unknown;

interface ExtractedError {
    status?: number;
    message?: string;
    fieldErrors: FieldErrors;
}

function flattenErrorMessages(errors: unknown): string[] {
    if (!errors) return [];
    if (typeof errors === 'string') return [errors];
    if (Array.isArray(errors)) {
        return errors.flatMap((value) => flattenErrorMessages(value)).filter(Boolean);
    }
    if (typeof errors === 'object') {
        return Object.values(errors as Record<string, unknown>)
            .flatMap((value) => flattenErrorMessages(value))
            .filter(Boolean);
    }
    return [];
}

/**
 * Normaliza qualquer erro para `{ status, message, fieldErrors }`.
 *
 * Cobre os três formatos que circulam no app: o `ApiError` lançado pelo
 * interceptor, um `AxiosError` cru e um `Error` comum.
 */
function extract(error: unknown): ExtractedError {
    if (error instanceof ApiErrorClass) {
        return {
            status: error.status,
            message: error.response?.data?.message ?? error.message,
            fieldErrors: error.fieldErrors,
        };
    }

    if (axios.isAxiosError<ApiErrorBody>(error)) {
        return {
            status: error.response?.status,
            message: error.response?.data?.message ?? error.message,
            fieldErrors: error.response?.data?.errors ?? {},
        };
    }

    if (error instanceof Error) {
        return { message: error.message, fieldErrors: {} };
    }

    return { fieldErrors: {} };
}

export function getErrorMessage(error: unknown): string {
    if (__DEV__) {
        console.error('API Error:', error);
    }

    const { status, message, fieldErrors } = extract(error);

    if (isNetworkError(error)) {
        return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
    }

    if (status === undefined) {
        return 'Não foi possível completar a operação. Verifique os dados e tente novamente.';
    }

    const validationMessages = flattenErrorMessages(fieldErrors);

    // Erro de validação (400/422) - mostrar erros específicos de campos
    if ((status === 400 || status === 422) && validationMessages.length > 0) {
        return validationMessages.join('\n');
    }
    // Erro de conflito (409) - dados duplicados
    if (status === 409) {
        return message || 'Dados já existem no sistema. Verifique os dados informados.';
    }
    // Erro de requisição inválida (400)
    if (status === 400) {
        return message || 'Dados inválidos. Verifique todas as informações.';
    }
    // Erro de não encontrado (404)
    if (status === 404) {
        return message || 'Recurso não encontrado.';
    }
    // Erro de não autorizado (401)
    if (status === 401) {
        return 'Sessão expirada. Faça login novamente.';
    }
    // Erro de proibido (403)
    if (status === 403) {
        return 'Você não tem permissão para realizar esta ação.';
    }
    // Outros erros do servidor (5xx)
    if (status >= 500) {
        return 'Erro interno do servidor. Tente novamente em alguns minutos.';
    }
    // Outros erros de cliente (4xx)
    if (status >= 400) {
        return message || 'Erro na requisição. Verifique os dados.';
    }

    return 'Não foi possível completar a operação. Verifique os dados e tente novamente.';
}

export function useErrorHandler() {
    return useCallback((error: unknown, defaultMessage?: string): string => {
        return defaultMessage || getErrorMessage(error);
    }, []);
}

export function useErrorAlert() {
    const getError = useErrorHandler();

    return useCallback((error: unknown, title: string = 'Erro', defaultMessage?: string) => {
        const message = getError(error, defaultMessage);
        Alert.alert(title, message);
    }, [getError]);
}

export function withErrorHandler<T extends unknown[], R>(
    operation: (...args: T) => Promise<R>,
    errorHandler: (error: unknown) => void
) {
    return async (...args: T): Promise<R | undefined> => {
        try {
            return await operation(...args);
        } catch (error) {
            errorHandler(error);
            return undefined;
        }
    };
}

export function useFormError() {
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = React.useState(false);

    const parseFieldErrors = (err: unknown): Record<string, string> => {
        const { status, fieldErrors: raw } = extract(err);

        if (status !== 400 && status !== 422) {
            return {};
        }

        const result: Record<string, string> = {};

        for (const [key, value] of Object.entries(raw)) {
            const messages = flattenErrorMessages(value);
            if (messages.length > 0) {
                result[key] = messages[0];
            }
        }

        return result;
    };

    const handleError = useCallback((err: unknown, defaultMessage?: string) => {
        const fields = parseFieldErrors(err);
        setFieldErrors(fields);
        const message = getErrorMessage(err) || defaultMessage || 'Ocorreu um erro inesperado.';
        setError(message);
        setIsLoading(false);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
        setFieldErrors({});
    }, []);

    const startLoading = useCallback(() => {
        setIsLoading(true);
        setError(null);
    }, []);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
    }, []);

    const withFormError = useCallback(
        <T extends unknown[], R>(
            operation: (...args: T) => Promise<R>
        ) => {
            return async (...args: T): Promise<R | undefined> => {
                try {
                    startLoading();
                    const result = await operation(...args);
                    clearError();
                    return result;
                } catch (error) {
                    handleError(error);
                    return undefined;
                } finally {
                    stopLoading();
                }
            };
        },
        [startLoading, clearError, handleError, stopLoading]
    );

    return {
        error,
        fieldErrors,
        isLoading,
        handleError,
        clearError,
        startLoading,
        stopLoading,
        withFormError,
    };
}
