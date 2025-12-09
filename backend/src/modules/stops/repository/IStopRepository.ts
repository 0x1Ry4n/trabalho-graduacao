import { Stop } from "../interfaces/Stop";
import { StopInsert, StopUpdate, StopFilters } from "../stop.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";

export interface IStopRepository {
    findById(id: number, tx?: DbTransaction): Promise<Stop | null>;
    findByName(name: string, tx?: DbTransaction): Promise<Stop | null>;
    list(tx?: DbTransaction): Promise<Stop[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: StopFilters, tx?: DbTransaction): Promise<PaginatedDocument<Stop> | null>;
    create(data: StopInsert, tx?: DbTransaction): Promise<Stop>;
    update(id: number, data: StopUpdate, tx?: DbTransaction): Promise<Stop | null>;
    delete(id: number, tx?: DbTransaction): Promise<Stop | null>;
}
