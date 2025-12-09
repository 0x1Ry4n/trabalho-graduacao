import { Route } from "../interfaces/Route";
import { RouteInsert, RouteUpdate, RouteFilters } from "../route.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";

export interface IRouteRepository {
    findById(id: number, tx?: DbTransaction): Promise<Route | null>;
    findByName(name: string, tx?: DbTransaction): Promise<Route | null>;
    list(tx?: DbTransaction): Promise<Route[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: RouteFilters, tx?: DbTransaction): Promise<PaginatedDocument<Route> | null>;
    create(data: RouteInsert, tx?: DbTransaction): Promise<Route>;
    update(id: number, data: RouteUpdate, tx?: DbTransaction): Promise<Route | null>;
    activate(id: number, tx?: DbTransaction): Promise<void>;
    inactivate(id: number, tx?: DbTransaction): Promise<void>;
    delete(id: number, tx?: DbTransaction): Promise<Route | null>;
    getStops(routeId: number, tx?: DbTransaction): Promise<any[]>;
    addStop(routeId: number, stopId: number, stopOrder: number, estimatedArrival: number, tx?: DbTransaction): Promise<any>;
    removeStop(routeId: number, stopId: number, tx?: DbTransaction): Promise<void>;
    updateStopOrder(routeId: number, stopId: number, newOrder: number, estimatedArrival: number, tx?: DbTransaction): Promise<void>;
}
