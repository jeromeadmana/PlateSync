import apiClient from './client';
import type { ApiResponse, Category, MenuItem, Modifier } from '../types';

export const menuApi = {
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/menu/categories');
    return response.data.data;
  },

  createCategory: async (data: { name: string; sort_order?: number }): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>('/menu/categories', data);
    return response.data.data;
  },

  updateCategory: async (id: number, data: Partial<Category>): Promise<void> => {
    await apiClient.put(`/menu/categories/${id}`, data);
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/menu/categories/${id}`);
  },

  getMenuItems: async (filters?: { categoryId?: number; status?: string }): Promise<MenuItem[]> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get<ApiResponse<MenuItem[]>>('/menu/items', { params });
    return response.data.data;
  },

  getMenuItem: async (id: number): Promise<MenuItem> => {
    const response = await apiClient.get<ApiResponse<MenuItem>>(`/menu/items/${id}`);
    return response.data.data;
  },

  createMenuItem: async (data: {
    category_id?: number;
    name: string;
    description?: string;
    base_price: number;
    image_url?: string;
  }): Promise<MenuItem> => {
    const response = await apiClient.post<ApiResponse<MenuItem>>('/menu/items', data);
    return response.data.data;
  },

  updateMenuItem: async (id: number, data: Partial<MenuItem>): Promise<void> => {
    await apiClient.put(`/menu/items/${id}`, data);
  },

  deleteMenuItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/menu/items/${id}`);
  },

  addModifier: async (
    menuItemId: number,
    data: { name: string; extra_price: number }
  ): Promise<Modifier> => {
    const response = await apiClient.post<ApiResponse<Modifier>>(
      `/menu/items/${menuItemId}/modifiers`,
      data
    );
    return response.data.data;
  },

  deleteModifier: async (modifierId: number): Promise<void> => {
    await apiClient.delete(`/menu/modifiers/${modifierId}`);
  },
};
