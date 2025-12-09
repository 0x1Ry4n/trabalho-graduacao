import apiClient from './client';
import { RouteStopLink } from '../types';

export const routeStopsApi = {
  getById: async (id: string): Promise<RouteStopLink> => {
    const response = await apiClient.get<RouteStopLink>(`/route-stops/${id}`);
    return response.data;
  },
};
