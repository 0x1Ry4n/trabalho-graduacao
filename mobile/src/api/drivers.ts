import apiClient from './client';
import { Driver, CreateDriverDto, UpdateDriverDto } from '../types';
import axios from 'axios';

export const driversApi = {
  list: async (): Promise<Driver[]> => {
    const response = await apiClient.get<Driver[]>('/drivers');
    return response.data;
  },

  getById: async (id: string): Promise<Driver> => {
    const response = await apiClient.get<Driver>(`/drivers/${id}`);
    return response.data;
  },

  getByUserId: async (userId: string | number): Promise<Driver | null> => {
    try {
      const response = await apiClient.get<Driver>(
        `/drivers/userId/${String(userId)}`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (dto: CreateDriverDto): Promise<Driver> => {
    const response = await apiClient.post<Driver>('/drivers', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateDriverDto): Promise<Driver> => {
    const response = await apiClient.patch<Driver>(`/drivers/${id}`, dto);
    return response.data;
  },

  activate: async (id: string): Promise<void> => {
    await apiClient.patch(`/drivers/${id}/activate`);
  },

  inactivate: async (id: string): Promise<void> => {
    await apiClient.patch(`/drivers/${id}/inactivate`);
  },
};
