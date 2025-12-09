export type PaginationParams = {
    page: number;
    pageSize: number;
};

export type PaginationMeta = {
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type PaginatedDocument<T> = {
    data: T[];
    pagination: PaginationMeta;
};
