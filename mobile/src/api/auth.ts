import apiClient from './client';
import axios from 'axios';
import { LoginResponse } from '../types';
import { ApiError } from '../utils/error.utils';

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: username,
        password,
      });

      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiError>(err)) {
        throw new Error(
          err.response?.data?.message || 'Erro ao realizar login'
        );
      }

      throw new Error('Erro ao realizar login');
    }
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {});
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
