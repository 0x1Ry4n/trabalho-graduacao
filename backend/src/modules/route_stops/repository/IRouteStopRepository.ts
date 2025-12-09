import { RouteStop } from "../interfaces/RouteStop";
import { RouteStopInsert, RouteStopUpdate, RouteStopFilters } from "../route-stop.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";

export interface IRouteStopRepository {
    findById(id: number, tx?: DbTransaction): Promise<RouteStop | null>;
    findByRouteAndStop(routeId: number, stopId: number, tx?: DbTransaction): Promise<RouteStop | null>;
    findByRouteAndOrder(routeId: number, stopOrder: number, tx?: DbTransaction): Promise<RouteStop | null>;
    listByRoute(routeId: number, tx?: DbTransaction): Promise<RouteStop[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: RouteStopFilters, tx?: DbTransaction): Promise<PaginatedDocument<RouteStop> | null>;
    create(data: RouteStopInsert, tx?: DbTransaction): Promise<RouteStop>;
    update(id: number, data: RouteStopUpdate, tx?: DbTransaction): Promise<RouteStop | null>;
    delete(id: number, tx?: DbTransaction): Promise<RouteStop | null>;
}
