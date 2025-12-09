import { College } from "../interfaces/College";
import { CollegeFilters, CollegeInsert, CollegeUpdate } from "../college.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";

export interface ICollegeRepository {
    findById(id: number, tx?: DbTransaction): Promise<College | null>;
    findByName(collegeName: string, tx?: DbTransaction): Promise<College | null>;
    list(tx?: DbTransaction): Promise<College[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: CollegeFilters, tx?: DbTransaction): Promise<PaginatedDocument<College> | null>;
    create(data: CollegeInsert, tx?: DbTransaction): Promise<College>;
    update(id: number, data: CollegeUpdate, tx?: DbTransaction): Promise<College | null>;
    activate(id: number, tx?: DbTransaction): Promise<void>;
    inactivate(id: number, tx?: DbTransaction): Promise<void>;
}