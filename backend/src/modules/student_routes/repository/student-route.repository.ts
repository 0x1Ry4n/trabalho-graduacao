import { Service } from "typedi";
import { BaseRepository, DbTransaction } from "../../../shared/database/base.repository";
import { StudentRoute } from "../interfaces/StudentRoute";
import { IStudentRouteRepository } from "./IStudentRouteRepository";
import { routeStopsTable, studentRoutesTable } from "../../../config/db/db.schema";
import { and, asc, count, eq, SQL } from "drizzle-orm";
import { PaginatedDocument } from "../../../shared/utils/pagination/pagination.types";
import { StudentRouteFilters, StudentRouteInsert, StudentRouteUpdate } from "../student-route.types";
import { paginateQuery } from "../../../shared/utils/pagination/pagination.utils";
import { RoutePeriod } from "../../../shared/enums/route-period.enum";

@Service()
export default class StudentRouteRepository extends BaseRepository<StudentRoute> implements IStudentRouteRepository {
    async findById(id: number, tx?: DbTransaction): Promise<StudentRoute | null> {
        const dbInstance = this.getDb(tx);

        const [studentRoute] = await dbInstance
            .select()
            .from(studentRoutesTable)
            .where(eq(studentRoutesTable.id, id))
            .limit(1);

        return studentRoute ?? null;
    }

    async findByStudentRouteStopAndPeriod(studentId: number, routeStopId: number, period: RoutePeriod, tx?: DbTransaction): Promise<StudentRoute | null> {
        const dbInstance = this.getDb(tx);

        const [studentRoute] = await dbInstance
            .select()
            .from(studentRoutesTable)
            .where(and(
                eq(studentRoutesTable.studentId, studentId),
                eq(studentRoutesTable.routeStopId, routeStopId),
                eq(studentRoutesTable.routePeriod, period)
            ))
            .limit(1);

        return studentRoute ?? null;
    }

    async listByStudent(studentId: number, tx?: DbTransaction): Promise<StudentRoute[]> {
        const dbInstance = this.getDb(tx);

        return await dbInstance
            .select()
            .from(studentRoutesTable)
            .where(eq(studentRoutesTable.studentId, studentId))
            .orderBy(asc(studentRoutesTable.id));
    }

    async listByRoute(routeId: number, tx?: DbTransaction): Promise<StudentRoute[]> {
        const dbInstance = this.getDb(tx);

        return await dbInstance
            .select({
                id: studentRoutesTable.id,
                studentId: studentRoutesTable.studentId,
                routeStopId: studentRoutesTable.routeStopId,
                routePeriod: studentRoutesTable.routePeriod,
                departureTime: studentRoutesTable.departureTime,
                returnTime: studentRoutesTable.returnTime,
                startDate: studentRoutesTable.startDate,
                endDate: studentRoutesTable.endDate,
                active: studentRoutesTable.active,
                deletedAt: studentRoutesTable.deletedAt,
                createdAt: studentRoutesTable.createdAt,
                updatedAt: studentRoutesTable.updatedAt,
            })
            .from(studentRoutesTable)
            .innerJoin(routeStopsTable, eq(studentRoutesTable.routeStopId, routeStopsTable.id))
            .where(eq(routeStopsTable.routeId, routeId))
            .orderBy(asc(studentRoutesTable.id));
    }

    async create(data: StudentRouteInsert, tx?: DbTransaction): Promise<StudentRoute> {
        const dbInstance = this.getDb(tx);

        const [studentRoute] = await dbInstance
            .insert(studentRoutesTable)
            .values(data)
            .returning();

        return studentRoute;
    }

    async update(id: number, data: StudentRouteUpdate, tx?: DbTransaction): Promise<StudentRoute | null> {
        const dbInstance = this.getDb(tx);

        const [studentRoute] = await dbInstance
            .update(studentRoutesTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(studentRoutesTable.id, id))
            .returning();

        return studentRoute ?? null;
    }

    async activate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(studentRoutesTable)
            .set({ active: 1 })
            .where(eq(studentRoutesTable.id, id));
    }

    async inactivate(id: number, tx?: DbTransaction): Promise<void> {
        const dbInstance = this.getDb(tx);

        await dbInstance
            .update(studentRoutesTable)
            .set({ active: 0 })
            .where(eq(studentRoutesTable.id, id));
    }

    async delete(id: number, tx?: DbTransaction): Promise<StudentRoute | null> {
        const dbInstance = this.getDb(tx);

        const [studentRoute] = await dbInstance
            .update(studentRoutesTable)
            .set({ active: 0, deletedAt: new Date() })
            .where(eq(studentRoutesTable.id, id))
            .returning();

        return studentRoute ?? null;
    }

    async listWithFiltersPaginated(
        page: number,
        pageSize: number,
        filters?: StudentRouteFilters,
        tx?: DbTransaction
    ): Promise<PaginatedDocument<StudentRoute> | null> {
        const dbInstance = this.getDb(tx);

        let query = dbInstance
            .select({
                id: studentRoutesTable.id,
                studentId: studentRoutesTable.studentId,
                routeStopId: studentRoutesTable.routeStopId,
                routePeriod: studentRoutesTable.routePeriod,
                departureTime: studentRoutesTable.departureTime,
                returnTime: studentRoutesTable.returnTime,
                startDate: studentRoutesTable.startDate,
                endDate: studentRoutesTable.endDate,
                active: studentRoutesTable.active,
                deletedAt: studentRoutesTable.deletedAt,
                createdAt: studentRoutesTable.createdAt,
                updatedAt: studentRoutesTable.updatedAt,
            })
            .from(studentRoutesTable)
            .$dynamic();

        if (filters?.search) {
            const { studentId, routeId, routeStopId, routePeriod, active } = filters.search;
            const conditions: SQL[] = [];

            if (studentId) conditions.push(eq(studentRoutesTable.studentId, studentId));
            if (routeId) {
                query = query.innerJoin(routeStopsTable, eq(studentRoutesTable.routeStopId, routeStopsTable.id));
                conditions.push(eq(routeStopsTable.routeId, routeId));
            }
            if (routeStopId) conditions.push(eq(studentRoutesTable.routeStopId, routeStopId));
            if (routePeriod) conditions.push(eq(studentRoutesTable.routePeriod, routePeriod as RoutePeriod));
            if (active !== undefined) conditions.push(eq(studentRoutesTable.active, active));

            if (conditions.length) {
                query = query.where(and(...conditions));
            }
        }

        const totalCountQuery = await dbInstance
            .select({ count: count() })
            .from(studentRoutesTable);

        return paginateQuery<StudentRoute>(
            query,
            totalCountQuery,
            asc(studentRoutesTable.id),
            { page, pageSize }
        );
    }
}
