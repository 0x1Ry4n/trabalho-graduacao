import apiClient from './client';
import { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '../types';

export const vehiclesApi = {
  list: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehicles');
    return response.data;
  },

  getById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  create: async (dto: CreateVehicleDto): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>('/vehicles', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateVehicleDto): Promise<Vehicle> => {
    const response = await apiClient.patch<Vehicle>(`/vehicles/${id}`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}`);
  },
};
