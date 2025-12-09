import apiClient from './client';
import { PriceTable, CreatePriceTableDto, UpdatePriceTableDto, AccountReceivableType } from '../types';

export const priceTablesApi = {
    list: async (): Promise<PriceTable[]> => {
        const response = await apiClient.get<PriceTable[]>('/accountReceivables/priceTables');
        return response.data;
    },

    getById: async (id: string): Promise<PriceTable> => {
        const response = await apiClient.get<PriceTable>(`/accountReceivables/priceTables/${id}`);
        return response.data;
    },

    getByType: async (type: AccountReceivableType): Promise<PriceTable> => {
        const response = await apiClient.get<PriceTable>(`/accountReceivables/priceTables/type/${type}`);
        return response.data;
    },

    create: async (dto: CreatePriceTableDto): Promise<PriceTable> => {
        const response = await apiClient.post<PriceTable>('/accountReceivables/priceTables', dto);
        return response.data;
    },

    update: async (id: string, dto: UpdatePriceTableDto): Promise<PriceTable> => {
        const response = await apiClient.patch<PriceTable>(`/accountReceivables/priceTables/${id}`, dto);
        return response.data;
    },

    activate: async (id: string): Promise<PriceTable> => {
        const response = await apiClient.patch<PriceTable>(`/accountReceivables/priceTables/${id}/activate`);
        return response.data;
    },

    inactivate: async (id: string): Promise<PriceTable> => {
        const response = await apiClient.patch<PriceTable>(`/accountReceivables/priceTables/${id}/inactivate`);
        return response.data;
    }
};