import apiClient from './client';
import { College, CreateCollegeDto, UpdateCollegeDto } from '../types';

export const collegesApi = {
    list: async (): Promise<College[]> => {
        const response = await apiClient.get<College[]>('/colleges');
        return response.data;
    },

    getById: async (id: string): Promise<College> => {
        const response = await apiClient.get<College>(`/colleges/${id}`);
        return response.data;
    },

    create: async (dto: CreateCollegeDto): Promise<College> => {
        const response = await apiClient.post<College>('/colleges', dto);
        return response.data;
    },

    update: async (id: string, dto: UpdateCollegeDto): Promise<College> => {
        const response = await apiClient.patch<College>(`/colleges/${id}`, dto);
        return response.data;
    },

    activate: async (id: string): Promise<void> => {
        await apiClient.patch(`/colleges/${id}/activate`);
    },

    inactivate: async (id: string): Promise<void> => {
        await apiClient.patch(`/colleges/${id}/inactivate`);
    },
};
