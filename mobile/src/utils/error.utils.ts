import React, { useCallback } from 'react';
import { Alert } from 'react-native';

export interface ApiError {
    response?: {
        status: number;
        data?: any;
    };
    message?: string;
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

export function getErrorMessage(error: ApiError): string {
    console.error('API Error:', error.response?.data || error.message);

    let errorMessage = 'Não foi possível completar a operação. Verifique os dados e tente novamente.';

    if (error.response) {
        const { status, data } = error.response;
        const validationMessages = flattenErrorMessages(data?.errors);

        // Erro de validação (422) - mostrar erros específicos de campos
        if ((status === 400 || status === 422) && validationMessages.length > 0) {
            errorMessage = validationMessages.join('\n');
        }
        // Erro de conflito (409) - dados duplicados
        else if (status === 409) {
            errorMessage = data?.message || 'Dados já existem no sistema. Verifique os dados informados.';
        }
        // Erro de requisição inválida (400)
        else if (status === 400) {
            errorMessage = data?.message || 'Dados inválidos. Verifique todas as informações.';
        }
        // Erro de não encontrado (404)
        else if (status === 404) {
            errorMessage = data?.message || 'Recurso não encontrado.';
        }
        // Erro de não autorizado (401)
        else if (status === 401) {
            errorMessage = 'Sessão expirada. Faça login novamente.';
        }
        // Erro de proibido (403)
        else if (status === 403) {
            errorMessage = 'Você não tem permissão para realizar esta ação.';
        }
        // Outros erros do servidor (5xx)
        else if (status >= 500) {
            errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
        }
        // Outros erros de cliente (4xx)
        else if (status >= 400) {
            errorMessage = data?.message || 'Erro na requisição. Verifique os dados.';
        }
    }

    return errorMessage;
}

export function useErrorHandler() {
    return useCallback((error: ApiError, defaultMessage?: string): string => {
        return defaultMessage || getErrorMessage(error);
    }, []);
}

export function useErrorAlert() {
    const getError = useErrorHandler();

    return useCallback((error: ApiError, title: string = 'Erro', defaultMessage?: string) => {
        const message = getError(error, defaultMessage);
        Alert.alert(title, message);
    }, [getError]);
}

export function withErrorHandler<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    errorHandler: (error: ApiError) => void
) {
    return async (...args: T): Promise<R | undefined> => {
        try {
            return await operation(...args);
        } catch (error) {
            errorHandler(error as ApiError);
            return undefined;
        }
    };
}

export function useFormError() {
    const [error, setError] = React.useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = React.useState(false);

    const parseFieldErrors = (err: ApiError): Record<string, string> => {
        if (err.response?.status === 422 && err.response?.data?.errors) {
            const { errors } = err.response.data;
            if (typeof errors === 'object' && !Array.isArray(errors)) {
                const result: Record<string, string> = {};
                for (const [key, value] of Object.entries(errors)) {
                    const messages = flattenErrorMessages(value);
                    if (messages.length > 0) {
                        result[key] = messages[0];
                    }
                }
                return result;
            }
        }
        return {};
    };

    const handleError = useCallback((err: ApiError, defaultMessage?: string) => {
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
        <T extends any[], R>(
            operation: (...args: T) => Promise<R>
        ) => {
            return async (...args: T): Promise<R | undefined> => {
                try {
                    startLoading();
                    const result = await operation(...args);
                    clearError();
                    return result;
                } catch (error) {
                    handleError(error as ApiError);
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
