import { Inject, Service } from "typedi";
import { Request, Response } from "express";
import { AccountReceivableFilters, AccountReceivableListPaginatedQuery } from "./account_receivable.types";
import { buildFilters } from "../../shared/utils/filters.utils";
import { AccountReceivableType } from "../../shared/enums/account-receivable-type.enum";
import AccountReceivableService from "./account_receivable.service";
import SendResponse from "../../shared/utils/response.utils";

@Service()
export default class AccountReceivableController {
    constructor(
        @Inject(() => AccountReceivableService)
        private readonly accountReceivableService: AccountReceivableService
    ) { }

    // ─── Accounts Receivable Controllers ─────────────────────────────────────────

    async list(req: Request, res: Response) {
        const accountsReceivable = await this.accountReceivableService.list();
        return SendResponse.success(res, accountsReceivable);
    }

    async listWithFiltersPaginated(req: Request, res: Response) {
        let { page, pageSize, amount, description,
            dueDate, enrollmentId, payerId, paymentDate, accountReceivableType,
            paymentProofType, paymentProofUrl, paymentType, status
        } = req.query as unknown as AccountReceivableListPaginatedQuery;

        page = Number(page) || 1;
        pageSize = Number(pageSize) || 10;

        const filters = buildFilters<AccountReceivableFilters, AccountReceivableListPaginatedQuery>({
            amount, description,
            dueDate, enrollmentId, payerId, paymentDate, accountReceivableType,
            paymentProofType, paymentProofUrl, paymentType, status
        });

        const result = await this.accountReceivableService.listWithFiltersPaginated(page, pageSize, filters);
        if (!result) return SendResponse.badRequest(res);

        return SendResponse.paginated(res, result);
    }

    async findById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const accountReceivable = await this.accountReceivableService.findById(id);
        return SendResponse.success(res, accountReceivable);
    }

    async findByUserId(req: Request, res: Response) {
        const userId = Number(req.params.userId);
        const accountsReceivable = await this.accountReceivableService.findByUserId(userId);
        return SendResponse.success(res, accountsReceivable);
    }

    async findByEnrollmentId(req: Request, res: Response) {
        const enrollmentId = Number(req.params.enrollmentId);
        const accountsReceivable = await this.accountReceivableService.findByEnrollmentId(enrollmentId);
        return SendResponse.success(res, accountsReceivable);
    }

    async create(req: Request, res: Response) {
        const accountReceivable = await this.accountReceivableService.create(req.body);
        return SendResponse.success(res, accountReceivable);
    }

    async update(req: Request, res: Response) {
        const id = Number(req.params.id);
        const accountReceivable = await this.accountReceivableService.update(id, req.body);
        return SendResponse.success(res, accountReceivable);
    }

    // ─── Price Tables Controllers ─────────────────────────────────────────────────


    async listPriceTables(req: Request, res: Response) {
        const priceTables = await this.accountReceivableService.listPriceTables();
        return SendResponse.success(res, priceTables);
    }


    async findPriceTableById(req: Request, res: Response) {
        const id = Number(req.params.id);
        const priceTable = await this.accountReceivableService.findPriceTableById(id);
        return SendResponse.success(res, priceTable);
    }


    async findPriceTableByType(req: Request, res: Response) {
        const type = req.params.type as unknown as AccountReceivableType;
        const priceTable = await this.accountReceivableService.findPriceTableByType(type);
        return SendResponse.success(res, priceTable);
    }


    async createPriceTable(req: Request, res: Response) {
        const priceTable = await this.accountReceivableService.createPriceTable(req.body);
        return SendResponse.success(res, priceTable);
    }

    async updatePriceTable(req: Request, res: Response) {
        const id = Number(req.params.id);
        const priceTable = await this.accountReceivableService.updatePriceTable(id, req.body);
        return SendResponse.success(res, priceTable);
    }

    async inactivatePriceTable(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.accountReceivableService.inactivatePriceTable(id);
        return SendResponse.success(res, { message: 'Tabela de preços inativada com sucesso!' });
    }

    async activatePriceTable(req: Request, res: Response) {
        const id = Number(req.params.id);
        await this.accountReceivableService.activatePriceTable(id);
        return SendResponse.success(res, { message: 'Tabela de preços ativada com sucesso!' });
    }
}