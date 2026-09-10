import crypto from "node:crypto";
import { envConfig } from "../../../config/env/env.config";

/**
 * Chave publica da AbacatePay usada para assinar os payloads de webhook.
 *
 * E um valor publico e compartilhado, documentado por eles em
 * https://docs.abacatepay.com/pages/webhooks/security — nao e um segredo nosso.
 * Sozinha ela prova apenas que o corpo nao foi adulterado; quem prova que o
 * evento e da nossa loja e o `webhookSecret` na query string. Por isso as duas
 * checagens sao obrigatorias.
 */
const ABACATEPAY_PUBLIC_KEY =
    "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

/**
 * Comparacao de tempo constante entre duas strings.
 *
 * `timingSafeEqual` lanca quando os buffers tem tamanhos diferentes, entao o
 * tamanho e checado antes — e sim, esse ramo vaza o comprimento, que nao e
 * secreto.
 */
function safeEquals(a: string, b: string): boolean {
    const bufferA = Buffer.from(a, "utf8");
    const bufferB = Buffer.from(b, "utf8");

    if (bufferA.length !== bufferB.length) return false;

    return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Confere a assinatura HMAC-SHA256 do header `X-Webhook-Signature`.
 *
 * Recebe o corpo **cru**: qualquer reserializacao do JSON ja parseado muda
 * espacos e ordem de chaves, e a assinatura deixa de bater.
 */
export function verifyWebhookSignature(
    rawBody: Buffer | string,
    signatureFromHeader: string | undefined
): boolean {
    if (!signatureFromHeader) return false;

    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");

    const expected = crypto
        .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
        .update(body)
        .digest("base64");

    return safeEquals(expected, signatureFromHeader);
}

/** Confere o `webhookSecret` da query string contra o configurado no ambiente. */
export function verifyWebhookSecret(secretFromQuery: unknown): boolean {
    const configured = envConfig.abacatePay.webhookSecret;

    if (!configured || typeof secretFromQuery !== "string") return false;

    return safeEquals(configured, secretFromQuery);
}
