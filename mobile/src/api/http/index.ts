import axios from 'axios';
import { BASE_URL, DEFAULT_TIMEOUT } from './config';
import { attachInterceptors } from './interceptors';

/**
 * Instância única do cliente HTTP da aplicação.
 *
 * Todo acesso à API deve passar por aqui — é o único ponto com anexação de
 * token, refresh automático e desempacotamento do envelope.
 */
const apiClient = attachInterceptors(
    axios.create({
        baseURL: BASE_URL,
        timeout: DEFAULT_TIMEOUT,
        headers: { 'Content-Type': 'application/json' },
    }),
);

export default apiClient;
