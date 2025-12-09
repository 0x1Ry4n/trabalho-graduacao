import apiClient from './client';
import { PaginatedResponse } from '../types';

export const auditApi = {
    listPaginated: async (page = 1, pageSize = 20, params: Record<string, any> = {}): Promise<PaginatedResponse<any>> => {
        const response = await apiClient.get<PaginatedResponse<any>>('/audit-logs/paginated', { params: { page, pageSize, ...params } });
        return response.data;
    },
};

export default auditApi;
