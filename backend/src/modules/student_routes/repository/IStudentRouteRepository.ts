import { StudentRoute } from "../interfaces/StudentRoute";
import { StudentRouteInsert, StudentRouteUpdate, StudentRouteFilters } from "../student-route.types";
import { DbTransaction } from "../../../shared/database/base.repository";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { RoutePeriod } from "../../../shared/enums/route-period.enum";

export interface IStudentRouteRepository {
    findById(id: number, tx?: DbTransaction): Promise<StudentRoute | null>;
    findByStudentRouteStopAndPeriod(studentId: number, routeStopId: number, period: RoutePeriod, tx?: DbTransaction): Promise<StudentRoute | null>;
    listByStudent(studentId: number, tx?: DbTransaction): Promise<StudentRoute[]>;
    listByRoute(routeId: number, tx?: DbTransaction): Promise<StudentRoute[]>;
    listWithFiltersPaginated(page: number, pageSize: number, filters?: StudentRouteFilters, tx?: DbTransaction): Promise<PaginatedDocument<StudentRoute> | null>;
    create(data: StudentRouteInsert, tx?: DbTransaction): Promise<StudentRoute>;
    update(id: number, data: StudentRouteUpdate, tx?: DbTransaction): Promise<StudentRoute | null>;
    activate(id: number, tx?: DbTransaction): Promise<void>;
    inactivate(id: number, tx?: DbTransaction): Promise<void>;
    delete(id: number, tx?: DbTransaction): Promise<StudentRoute | null>;
}
