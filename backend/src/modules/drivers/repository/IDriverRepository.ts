import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { DriverFilters, DriverInsert, DriverUpdate } from "../driver.types";
import { Driver } from "../interfaces/Driver";

export interface IDriverRepository {
    findById(id: number, tx?: DbTransaction): Promise<Driver | null>;
    findByUserId(userId: number, tx?: DbTransaction): Promise<Driver | null>
    findByEmail(email: string, tx?: DbTransaction): Promise<Driver | null>;
    findByPhone(phone: string, tx?: DbTransaction): Promise<Driver | null>;
    findByCPF(cpf: string, tx?: DbTransaction): Promise<Driver | null>;
    findByRG(rg: string, tx?: DbTransaction): Promise<Driver | null>;
    list(tx?: DbTransaction): Promise<Driver[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: DriverFilters, tx?: DbTransaction): Promise<PaginatedDocument<Driver> | null>;
    create(data: DriverInsert, tx?: DbTransaction): Promise<Driver>;
    update(id: number, data: DriverUpdate, tx?: DbTransaction): Promise<Driver | null>;
    activate(id: number, tx?: DbTransaction): Promise<void>;
    inactivate(id: number, tx?: DbTransaction): Promise<void>;
}