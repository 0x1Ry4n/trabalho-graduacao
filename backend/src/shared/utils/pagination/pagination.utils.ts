import { SQL } from "drizzle-orm";
import { PgColumn, PgSelect } from "drizzle-orm/pg-core";
import { PaginatedDocument, PaginationParams } from "./pagination.types";

function withPagination<T extends PgSelect>(
    qb: T,
    orderByColumn: PgColumn | SQL | SQL.Aliased,
    page = 1,
    pageSize = 10,
) {
    return qb
        .orderBy(orderByColumn)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
}

export async function paginateQuery<T>(
    baseQuery: any,
    countQuery: any,
    orderBy: any,
    params: PaginationParams
): Promise<PaginatedDocument<T>> {
    const { page, pageSize } = params;

    const [data, totalResult] = await Promise.all([
        withPagination(baseQuery, orderBy, page, pageSize),
        countQuery.$dynamic()
    ]);

    const totalCount = totalResult[0]?.count ?? 0;

    return {
        data,
        pagination: {
            count: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
        }
    }
}