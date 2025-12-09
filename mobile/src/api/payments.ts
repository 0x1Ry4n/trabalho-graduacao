import apiClient from './client';
import {
  AccountReceivable,
  UpdateAccountReceivableDto,
  CreateAccountReceivableDto,
  PaginatedResponse,
} from '../types';

export const paymentsApi = {
  list: async (): Promise<AccountReceivable[]> => {
    const response =
      await apiClient.get<AccountReceivable[]>('/accountReceivables');
    return response.data;
  },

  getByUserId: async (userId: string): Promise<AccountReceivable[]> => {
    const response = await apiClient.get<AccountReceivable[]>(`/accountReceivables/userId/${userId}`);
    return response.data;
  },

  getByEnrollmentId: async (enrollmentId: string | number): Promise<AccountReceivable[]> => {
    const response = await apiClient.get<AccountReceivable[]>(
      `/accountReceivables/enrollmentId/${String(enrollmentId)}`,
    );
    return response.data;
  },

  getById: async (id: string): Promise<AccountReceivable> => {
    const response = await apiClient.get<AccountReceivable>(`/accountReceivables/${id}`);
    return response.data;
  },

  create: async (dto: CreateAccountReceivableDto): Promise<AccountReceivable> => {
    const response = await apiClient.post<AccountReceivable>('/accountReceivables', dto);
    return response.data;
  },

  listPaginated: async (
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<AccountReceivable>> => {
    const response = await apiClient.get<PaginatedResponse<AccountReceivable>>(
      '/accountReceivables/paginated',
      { params: { page, limit } },
    );
    return response.data;
  },

  update: async (
    id: string,
    dto: UpdateAccountReceivableDto,
  ): Promise<AccountReceivable> => {
    const response = await apiClient.patch<AccountReceivable>(
      `/accountReceivables/${id}`,
      dto,
    );
    return response.data;
  },
};
