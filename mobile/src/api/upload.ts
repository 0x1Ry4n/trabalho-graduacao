import apiClient from './client';
import { UPLOAD_TIMEOUT } from './http/config';

/** Arquivo escolhido pelo `expo-document-picker`. */
export interface UploadableFile {
    uri: string;
    name: string;
    mimeType?: string | null;
}

/** `/upload` responde `{ url }` sem envelope (backend `shared/routes/upload.route.ts`). */
export interface UploadResult {
    url: string;
}

/**
 * Envio de arquivos.
 *
 * Substitui as chamadas `fetch()` diretas que existiam em três telas
 * administrativas. Além de centralizar a montagem do FormData, passar pelo
 * `apiClient` traz o que o `fetch` manual não tinha:
 *
 * - anexação do token pelo interceptor (uma das telas lia a chave errada do
 *   SecureStore — `'token'` em vez de `'access_token'` — e enviava
 *   `Bearer null`);
 * - refresh automático em caso de 401;
 * - timeout (o `fetch` podia ficar pendurado indefinidamente);
 * - erros como `AxiosError`, tratáveis por `getErrorMessage`.
 */
export const uploadApi = {
    upload: async (file: UploadableFile): Promise<UploadResult> => {
        const formData = new FormData();

        // O React Native aceita este formato de "arquivo" no FormData; o cast é
        // necessário porque o tipo DOM de FormData espera Blob | string.
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
        } as unknown as Blob);

        const response = await apiClient.post<UploadResult>('/upload', formData, {
            timeout: UPLOAD_TIMEOUT,
            // Sobrescreve o application/json padrão da instância. O boundary do
            // multipart é preenchido pela camada de rede do React Native.
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    },
};

export default uploadApi;
