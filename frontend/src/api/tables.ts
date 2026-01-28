import apiClient from './client';
import type { ApiResponse, Table } from '../types';

export const tablesApi = {
  /**
   * Get all tables for the current store
   */
  getTables: async (status?: string): Promise<Table[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<ApiResponse<Table[]>>('/tables', { params });
    return response.data.data;
  },

  /**
   * Get a single table by ID
   */
  getTable: async (tableId: number): Promise<Table> => {
    const response = await apiClient.get<ApiResponse<Table>>(`/tables/${tableId}`);
    return response.data.data;
  },
};
