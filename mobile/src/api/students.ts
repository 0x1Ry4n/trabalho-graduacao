import apiClient from './client';
import {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
  CardValidation,
  CreateCardValidationDto,
} from '../types';
import axios from 'axios';

export const studentsApi = {
  list: async (): Promise<Student[]> => {
    const response = await apiClient.get<Student[]>('/students');
    return response.data;
  },

  getById: async (id: string): Promise<Student> => {
    const response = await apiClient.get<Student>(`/students/${id}`);
    return response.data;
  },

  getByUserId: async (userId: string | number): Promise<Student | null> => {
    try {
      const response = await apiClient.get<Student>(`/students/userId/${String(userId)}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (dto: CreateStudentDto): Promise<Student> => {
    const response = await apiClient.post<Student>('/students', dto);
    return response.data;
  },

  inactivate: async (id: string): Promise<void> => {
    await apiClient.patch(`/students/${id}/inactivate`);
  },

  activate: async (id: string): Promise<void> => {
    await apiClient.patch(`/students/${id}/activate`);
  },

  update: async (id: string, dto: UpdateStudentDto): Promise<Student> => {
    const response = await apiClient.patch<Student>(`/students/${id}`, dto);
    return response.data;
  },

  getCardValidations: async (id: string): Promise<CardValidation[]> => {
    const response = await apiClient.get<CardValidation[]>(
      `/students/${id}/cardValidations`,
    );
    return response.data;
  },

  createCardValidation: async (
    id: string,
    dto: CreateCardValidationDto,
  ): Promise<CardValidation> => {
    const response = await apiClient.post<CardValidation>(
      `/students/${id}/cardValidations`,
      dto,
    );
    return response.data;
  },
};
