import apiClient from './client';
import { User, CreateUserDto, UpdateUserDto } from '../types';

export const usersApi = {
    getMe: async (): Promise<User> => {
        const response = await apiClient.get<User>('/users/me');
        return response.data;
    },

    list: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    getById: async (id: string): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (dto: CreateUserDto): Promise<User> => {
        const response = await apiClient.post<User>('/users', dto);
        return response.data;
    },

    inactivate: async (id: string): Promise<void> => {
        await apiClient.patch(`/users/${id}/inactivate`);
    },

    activate: async (id: string): Promise<void> => {
        await apiClient.patch(`/users/${id}/activate`);
    },

    update: async (id: string, dto: UpdateUserDto): Promise<User> => {
        const response = await apiClient.patch<User>(`/users/${id}`, dto);
        return response.data;
    },
};
