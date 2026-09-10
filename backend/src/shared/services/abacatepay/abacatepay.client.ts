import { Service } from "typedi";
import { envConfig } from "../../../config/env/env.config";
import { ApiError } from "../../errors/error";
import { StatusCodes } from "http-status-codes";
import { logger } from "../../utils/logger.utils";
import { ChargeMethod } from "../../enums/charge-method.enum";
import {
    AbacateEnvelope,
    ChargeStatusResult,
    CreateHostedCheckoutInput,
    CreateTransparentBoletoInput,
    CreateTransparentPixInput,
    NormalizedCharge,
} from "./abacatepay.types";

/**
 * Client HTTP da AbacatePay.
 *
 * Concentra tudo que e especifico do gateway — envelope, nomes de campos,
 * unidade monetaria — para que o service de pagamentos trabalhe apenas com
 * `NormalizedCharge`. Trocar de provedor significa reescrever este arquivo, e
 * nao o dominio.
 *
 * A chave de API nunca sai daqui e nunca e logada.
 */
@Service()
export default class AbacatePayClient {
    private get config() {
        return envConfig.abacatePay;
    }

    /** Toda cobranca depende de a integracao estar ligada e configurada. */
    private ensureEnabled(): void {
        if (!this.config.enabled || !this.config.apiKey) {
            throw new ApiError(
                "Gateway de pagamento indisponivel no momento",
                StatusCodes.SERVICE_UNAVAILABLE
            );
        }
    }

    private async request<T>(
        method: "GET" | "POST",
        path: string,
        body?: unknown
    ): Promise<T> {
        this.ensureEnabled();

        // AbortController em vez de confiar no timeout do runtime: sem isso uma
        // requisicao pendurada seguraria o request do aluno indefinidamente.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout);

        let response: Response;

        try {
            response = await fetch(`${this.config.baseUrl}${path}`, {
                method,
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: controller.signal,
            });
        } catch (error) {
            const reason = controller.signal.aborted ? "timeout" : String(error);
            logger.error(`[AbacatePay] ${method} ${path} failed: ${reason}`);
            throw new ApiError(
                "Nao foi possivel contatar o gateway de pagamento",
                StatusCodes.BAD_GATEWAY
            );
        } finally {
            clearTimeout(timer);
        }

        const text = await response.text();
        let envelope: AbacateEnvelope<T>;

        try {
            envelope = JSON.parse(text) as AbacateEnvelope<T>;
        } catch {
            logger.error(
                `[AbacatePay] ${method} ${path} returned non-JSON (HTTP ${response.status})`
            );
            throw new ApiError(
                "Resposta invalida do gateway de pagamento",
                StatusCodes.BAD_GATEWAY
            );
        }

        // O gateway responde HTTP 200 com `success: false` em varios erros de
        // negocio, entao o status sozinho nao serve como criterio.
        if (!response.ok || !envelope.success || envelope.data === null) {
            const detail = envelope.error ?? `HTTP ${response.status}`;
            logger.error(`[AbacatePay] ${method} ${path} rejected: ${detail}`);
            throw new ApiError(
                `Gateway de pagamento recusou a operacao: ${detail}`,
                StatusCodes.BAD_GATEWAY
            );
        }

        return envelope.data;
    }

    /** Cobranca Pix transparente: devolve copia-e-cola para o app desenhar o QR. */
    async createPixCharge(input: CreateTransparentPixInput): Promise<NormalizedCharge> {
        const data = await this.request<{
            id: string;
            status: string;
            brCode: string;
            expiresAt?: string;
        }>("POST", "/transparents/create", {
            method: "PIX",
            data: {
                amount: input.amountCents,
                description: input.description,
                expiresIn: input.expiresInMinutes * 60,
                externalId: input.externalId,
                customer: input.customer,
                metadata: { externalId: input.externalId },
            },
        });

        return {
            providerChargeId: data.id,
            method: ChargeMethod.PIX,
            brCode: data.brCode,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            rawStatus: data.status,
        };
    }

    /**
     * Boleto transparente.
     *
     * Nome e CPF do pagador sao obrigatorios aqui — diferente do Pix, onde sao
     * apenas recomendados.
     */
    async createBoletoCharge(
        input: CreateTransparentBoletoInput
    ): Promise<NormalizedCharge> {
        const data = await this.request<{
            id: string;
            status: string;
            barCode: string;
            url: string;
            expiresAt?: string;
        }>("POST", "/transparents/create", {
            method: "BOLETO",
            data: {
                amount: input.amountCents,
                description: input.description,
                dueDate: input.dueDate,
                externalId: input.externalId,
                customer: input.customer,
                metadata: { externalId: input.externalId },
            },
        });

        return {
            providerChargeId: data.id,
            method: ChargeMethod.BOLETO,
            barCode: data.barCode,
            paymentUrl: data.url,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            rawStatus: data.status,
        };
    }

    /**
     * Checkout hospedado para cartao.
     *
     * O checkout da AbacatePay so aceita itens de catalogo, entao cada cobranca
     * cria antes um produto avulso com o valor exato daquela conta. Os valores
     * variam por matricula, o que inviabiliza um produto fixo reaproveitado.
     */
    async createCardCheckout(input: CreateHostedCheckoutInput): Promise<NormalizedCharge> {
        const product = await this.request<{ id: string }>("POST", "/products/create", {
            externalId: input.externalId,
            name: input.description,
            price: input.amountCents,
            currency: "BRL",
        });

        const data = await this.request<{
            id: string;
            url: string;
            status: string;
        }>("POST", "/checkouts/create", {
            items: [{ id: product.id, quantity: 1 }],
            methods: ["CARD"],
            externalId: input.externalId,
            returnUrl: input.returnUrl,
            completionUrl: input.completionUrl,
            metadata: { externalId: input.externalId },
        });

        return {
            providerChargeId: data.id,
            method: ChargeMethod.CARD,
            paymentUrl: data.url,
            rawStatus: data.status,
        };
    }

    /**
     * Consulta pontual de status.
     *
     * Rede de seguranca para quando o webhook nao chega (endpoint fora do ar,
     * ambiente de desenvolvimento sem URL publica). O caminho normal e o
     * webhook.
     */
    async checkChargeStatus(providerChargeId: string): Promise<ChargeStatusResult> {
        const data = await this.request<{ id: string; status: string; paidAt?: string }>(
            "GET",
            `/transparents/check?id=${encodeURIComponent(providerChargeId)}`
        );

        return {
            rawStatus: data.status,
            paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
        };
    }
}
