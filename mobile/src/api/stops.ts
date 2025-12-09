import apiClient from './client';
import { Stop, CreateStopDto, UpdateStopDto } from '../types';

export const stopsApi = {
  list: async (): Promise<Stop[]> => {
    const response = await apiClient.get<Stop[]>('/stops');
    return response.data;
  },

  getById: async (id: string): Promise<Stop> => {
    const response = await apiClient.get<Stop>(`/stops/${id}`);
    return response.data;
  },

  create: async (dto: CreateStopDto): Promise<Stop> => {
    const response = await apiClient.post<Stop>('/stops', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateStopDto): Promise<Stop> => {
    const response = await apiClient.patch<Stop>(`/stops/${id}`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/stops/${id}`);
  },
};
