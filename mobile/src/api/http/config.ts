import Constants from 'expo-constants';

/** Porta em que a API roda durante o desenvolvimento local. */
const DEV_API_PORT = 3000;

/**
 * Resolução da URL base da API.
 *
 * Ordem de precedência:
 *
 * 1. `EXPO_PUBLIC_API_URL` — variável de ambiente (arquivo `.env`, não versionado).
 *    É o lugar certo para o IP da máquina de desenvolvimento.
 * 2. `expo.extra.apiUrl` do `app.json` — usado em builds (EAS), onde não há `.env`.
 * 3. Autodetecção pelo `hostUri` do Expo — só em desenvolvimento.
 *
 * Se nada resolver, o erro é lançado explicitamente. A versão anterior tinha
 * `'https://sua-api-producao.com'` como retorno padrão: uma build de produção
 * mal configurada apontava silenciosamente para um domínio inexistente, e a
 * falha só aparecia como timeout de rede na tela do usuário.
 */

function normalize(url: string | undefined | null): string | null {
    const trimmed = url?.trim();

    if (!trimmed) {
        return null;
    }

    // Barra final atrapalha a concatenação de paths pelo axios.
    return trimmed.replace(/\/+$/, '');
}

function fromEnv(): string | null {
    return normalize(process.env.EXPO_PUBLIC_API_URL);
}

function fromAppConfig(): string | null {
    const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
    return normalize(extra?.apiUrl);
}

/**
 * Deriva o IP da máquina que serve o bundle. O `hostUri` vem no formato
 * "192.168.0.105:8081"; a API é assumida na mesma máquina, em DEV_API_PORT.
 */
function fromDevHost(): string | null {
    if (!__DEV__) {
        return null;
    }

    const host = normalize(Constants.expoConfig?.hostUri)?.split(':')[0];

    if (!host) {
        return null;
    }

    return `http://${host}:${DEV_API_PORT}`;
}

/**
 * Bloqueia HTTP em claro fora de desenvolvimento: tokens JWT e credenciais
 * trafegariam legíveis na rede.
 */
function assertTransportIsSafe(url: string): void {
    if (!__DEV__ && url.startsWith('http://')) {
        throw new Error(
            `[API] URL insegura em produção: "${url}". ` +
            'Use https:// — tokens de autenticação não podem trafegar em texto claro.',
        );
    }
}

function resolveBaseUrl(): string {
    const configured = fromEnv() ?? fromAppConfig();

    if (configured) {
        assertTransportIsSafe(configured);
        return configured;
    }

    const detected = fromDevHost();

    if (detected) {
        if (__DEV__) {
            console.log('[API] BASE_URL detectada automaticamente:', detected);
        }
        return detected;
    }

    throw new Error(
        '[API] Não foi possível determinar a URL da API. ' +
        'Defina EXPO_PUBLIC_API_URL no arquivo .env (veja .env.example) ' +
        'ou expo.extra.apiUrl no app.json.',
    );
}

export const BASE_URL = resolveBaseUrl();

/** Timeout padrão das requisições (ms). */
export const DEFAULT_TIMEOUT = 15_000;

/** Uploads carregam arquivos e precisam de uma janela maior. */
export const UPLOAD_TIMEOUT = 60_000;
