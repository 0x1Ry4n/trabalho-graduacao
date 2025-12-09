import apiClient from './client';
import { Enrollment, CreateEnrollmentDto, UpdateEnrollmentDto } from '../types';

export const enrollmentsApi = {
  list: async (): Promise<Enrollment[]> => {
    const response = await apiClient.get<Enrollment[]>('/enrollments');
    return response.data;
  },

  getById: async (id: string): Promise<Enrollment> => {
    const response = await apiClient.get<Enrollment>(`/enrollments/${id}`);
    console.log(response.data);
    return response.data;
  },

  getByStudentId: async (studentId: string | number): Promise<Enrollment[] | Enrollment | null> => {
    const response = await apiClient.get<Enrollment[] | Enrollment | null>(
      `/enrollments/studentId/${String(studentId)}`
    );

    return response.data;
  },

  create: async (dto: CreateEnrollmentDto): Promise<Enrollment> => {
    const response = await apiClient.post<Enrollment>('/enrollments', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateEnrollmentDto): Promise<Enrollment> => {
    const response = await apiClient.patch<Enrollment>(`/enrollments/${id}`, dto);
    return response.data;
  },
};
