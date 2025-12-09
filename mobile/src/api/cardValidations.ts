import apiClient from './client';
import { CardValidation, CreateCardValidationDto } from '../types';

export const cardValidationsApi = {
  create: async (
    studentId: string,
    dto: CreateCardValidationDto,
  ): Promise<CardValidation> => {
    const response = await apiClient.post<CardValidation>(
      `/students/${studentId}/cardValidations`,
      dto,
    );
    return response.data;
  },

  getByStudent: async (studentId: string): Promise<CardValidation[]> => {
    const response = await apiClient.get<CardValidation[]>(
      `/students/${studentId}/cardValidations`,
    );
    return response.data;
  },
};
