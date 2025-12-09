import { DbTransaction } from "../../../shared/database/base.repository";
import { AccountReceivableType } from "../../../shared/enums/account-receivable-type.enum";
import { AccountStatus } from "../../../shared/enums/account-status.enum";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { AccountReceivableFilters, AccountReceivableInsert, AccountReceivableUpdate, PriceTableInsert, PriceTableUpdate } from "../account_receivable.types";
import { AccountReceivable } from "../interfaces/AccountReceivable";
import { PriceTable } from "../interfaces/PriceTable";

export interface IAccountReceivableRepository {
    findById(id: number, tx?: DbTransaction): Promise<AccountReceivable | null>;
    findByCardCode(cardCode: string, tx?: DbTransaction): Promise<AccountReceivable[] | null>;
    findByStudentId(studentId: number, tx?: DbTransaction): Promise<AccountReceivable[] | null>;
    findByEnrollmentId(enrollmentId: number, tx?: DbTransaction): Promise<AccountReceivable[] | null>;
    findByStatus(status: AccountStatus, tx?: DbTransaction): Promise<AccountReceivable[] | null>;
    list(tx?: DbTransaction): Promise<AccountReceivable[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: AccountReceivableFilters, tx?: DbTransaction): Promise<PaginatedDocument<AccountReceivable> | null>;
    create(data: AccountReceivableInsert, tx?: DbTransaction): Promise<Partial<AccountReceivable> | null>;
    createMany(data: AccountReceivableInsert[], tx?: DbTransaction): Promise<Partial<AccountReceivable[]> | null>;
    update(id: number, data: AccountReceivableUpdate, tx?: DbTransaction): Promise<Partial<AccountReceivable> | null>;
    createPriceTable(data: PriceTableInsert, tx?: DbTransaction): Promise<PriceTable>;
    updatePriceTable(id: number, data: PriceTableUpdate, tx?: DbTransaction): Promise<PriceTable>;
    findPriceTableById(id: number, tx?: DbTransaction): Promise<PriceTable | null>;
    findPriceTableByType(type: AccountReceivableType, tx?: DbTransaction): Promise<PriceTable | null>;
    listPriceTables(tx?: DbTransaction): Promise<PriceTable[]>;
}
