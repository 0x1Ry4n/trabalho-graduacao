import { Service } from "typedi";
import { and, desc, eq, inArray } from "drizzle-orm";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { paymentChargesTable, webhookEventsTable } from "../../../config/db/db.schema";
import { PaymentCharge } from "../interfaces/PaymentCharge";
import { PaymentChargeInsert, PaymentChargeUpdate } from "../payment.types";
import { ChargeMethod } from "../../../shared/enums/charge-method.enum";
import { ChargeStatus } from "../../../shared/enums/charge-status.enum";
import { PaymentProvider } from "../../../shared/enums/payment-provider.enum";

/** Estados a partir dos quais a cobranca ainda pode mudar. */
const OPEN_STATUSES = [ChargeStatus.PENDING];

@Service()
export default class PaymentChargeRepository extends BaseRepository<PaymentCharge> {
    async create(data: PaymentChargeInsert, tx?: DbTransaction): Promise<PaymentCharge> {
        const dbInstance = this.getDb(tx);

        const [charge] = await dbInstance
            .insert(paymentChargesTable)
            .values({
                accountReceivableId: data.accountReceivableId,
                provider: data.provider,
                externalId: data.externalId,
                method: data.method,
                amountCents: data.amountCents,
            })
            .returning();

        return charge as PaymentCharge;
    }

    async update(
        id: number,
        data: PaymentChargeUpdate,
        tx?: DbTransaction
    ): Promise<PaymentCharge | null> {
        const dbInstance = this.getDb(tx);

        const [charge] = await dbInstance
            .update(paymentChargesTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(paymentChargesTable.id, id))
            .returning();

        return (charge as PaymentCharge) ?? null;
    }

    async findById(id: number, tx?: DbTransaction): Promise<PaymentCharge | null> {
        const dbInstance = this.getDb(tx);

        const [charge] = await dbInstance
            .select()
            .from(paymentChargesTable)
            .where(eq(paymentChargesTable.id, id))
            .limit(1);

        return (charge as PaymentCharge) ?? null;
    }

    async findByProviderChargeId(
        providerChargeId: string,
        tx?: DbTransaction
    ): Promise<PaymentCharge | null> {
        const dbInstance = this.getDb(tx);

        const [charge] = await dbInstance
            .select()
            .from(paymentChargesTable)
            .where(eq(paymentChargesTable.providerChargeId, providerChargeId))
            .limit(1);

        return (charge as PaymentCharge) ?? null;
    }

    async findByExternalId(
        externalId: string,
        tx?: DbTransaction
    ): Promise<PaymentCharge | null> {
        const dbInstance = this.getDb(tx);

        const [charge] = await dbInstance
            .select()
            .from(paymentChargesTable)
            .where(eq(paymentChargesTable.externalId, externalId))
            .limit(1);

        return (charge as PaymentCharge) ?? null;
    }

    /**
     * Cobranca ainda aberta para a conta e o metodo informados.
     *
     * Serve para reaproveitar um Pix vigente em vez de gerar um QR novo a cada
     * vez que o aluno reabre a tela — dois QR Codes validos para a mesma conta
     * abririam espaco para pagamento em duplicidade.
     */
    async findOpenByAccountAndMethod(
        accountReceivableId: number,
        method: ChargeMethod,
        tx?: DbTransaction
    ): Promise<PaymentCharge | null> {
        const dbInstance = this.getDb(tx);

        const [charge] = await dbInstance
            .select()
            .from(paymentChargesTable)
            .where(
                and(
                    eq(paymentChargesTable.accountReceivableId, accountReceivableId),
                    eq(paymentChargesTable.method, method),
                    inArray(paymentChargesTable.status, OPEN_STATUSES)
                )
            )
            .orderBy(desc(paymentChargesTable.createdAt))
            .limit(1);

        return (charge as PaymentCharge) ?? null;
    }

    async listByAccount(
        accountReceivableId: number,
        tx?: DbTransaction
    ): Promise<PaymentCharge[]> {
        const dbInstance = this.getDb(tx);

        const charges = await dbInstance
            .select()
            .from(paymentChargesTable)
            .where(eq(paymentChargesTable.accountReceivableId, accountReceivableId))
            .orderBy(desc(paymentChargesTable.createdAt));

        return charges as PaymentCharge[];
    }

    /**
     * Registra o evento de webhook e informa se ele e inedito.
     *
     * `onConflictDoNothing` sobre o indice unico de `eventKey` resolve a
     * idempotencia no banco: duas entregas simultaneas do mesmo evento nao
     * conseguem passar as duas, mesmo em processos diferentes. Fazer
     * "SELECT depois INSERT" deixaria essa janela aberta.
     */
    async registerWebhookEvent(
        eventKey: string,
        eventType: string,
        payload: unknown,
        provider: PaymentProvider,
        tx?: DbTransaction
    ): Promise<boolean> {
        const dbInstance = this.getDb(tx);

        const inserted = await dbInstance
            .insert(webhookEventsTable)
            .values({ eventKey, eventType, payload, provider })
            .onConflictDoNothing({ target: webhookEventsTable.eventKey })
            .returning({ id: webhookEventsTable.id });

        return inserted.length > 0;
    }
}
