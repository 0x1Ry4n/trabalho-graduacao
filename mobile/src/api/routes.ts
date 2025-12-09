import apiClient from './client';
import { Route, CreateRouteDto, UpdateRouteDto, RouteStop } from '../types';

export const routesApi = {
  list: async (): Promise<Route[]> => {
    const response = await apiClient.get<Route[]>('/routes');
    return response.data;
  },

  getById: async (id: string): Promise<Route> => {
    const response = await apiClient.get<Route>(`/routes/${id}`);
    return response.data;
  },

  create: async (dto: CreateRouteDto): Promise<Route> => {
    const response = await apiClient.post<Route>('/routes', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateRouteDto): Promise<Route> => {
    const response = await apiClient.patch<Route>(`/routes/${id}`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/routes/${id}`);
  },

  getStops: async (routeId: string): Promise<RouteStop[]> => {
    const response = await apiClient.get<RouteStop[]>(`/routes/${routeId}/stops`);
    return response.data;
  },

  addStop: async (routeId: string, stopId: string, stopOrder: number, estimatedArrival: number): Promise<any> => {
    const response = await apiClient.post(`/routes/${routeId}/stops`, {
      stopId: parseInt(stopId),
      stopOrder,
      estimatedArrival,
    });
    return response.data;
  },

  removeStop: async (routeId: string, stopId: string): Promise<void> => {
    await apiClient.delete(`/routes/${routeId}/stops/${stopId}`);
  },

  updateStopOrder: async (routeId: string, stopId: string, stopOrder: number, estimatedArrival: number): Promise<void> => {
    await apiClient.patch(`/routes/${routeId}/stops/${stopId}`, {
      stopOrder,
      estimatedArrival,
    });
  },
};
