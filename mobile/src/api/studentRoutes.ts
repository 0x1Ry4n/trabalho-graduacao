import apiClient from './client';
import {
  StudentRoute,
  CreateStudentRouteDto,
  PaginatedResponse,
} from '../types';

export type UpdateStudentRouteDto = Partial<Pick<
  CreateStudentRouteDto,
  'routeStopId' | 'departureTime' | 'returnTime' | 'startDate' | 'endDate' | 'active'
>>;

export const studentRoutesApi = {
  listPaginated: async (
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<StudentRoute>> => {
    const response = await apiClient.get<PaginatedResponse<StudentRoute>>(
      '/student-routes/paginated',
      { params: { page, limit } },
    );
    return response.data;
  },

  create: async (dto: CreateStudentRouteDto): Promise<StudentRoute> => {
    const response = await apiClient.post<StudentRoute>(
      '/student-routes',
      dto,
    );
    return response.data;
  },

  getByStudent: async (studentId: string): Promise<StudentRoute[]> => {
    const response = await apiClient.get<StudentRoute[]>(
      `/students/${studentId}/routes`,
    );
    return response.data;
  },

  update: async (id: string, dto: UpdateStudentRouteDto): Promise<StudentRoute> => {
    const response = await apiClient.patch<StudentRoute>(
      `/student-routes/${id}`,
      dto,
    );
    return response.data;
  },
};
