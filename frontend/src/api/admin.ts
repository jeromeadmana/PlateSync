import apiClient from './client';
import type { ApiResponse } from '../types';

export interface User {
  id: number;
  company_id: number;
  store_id: number | null;
  email: string;
  name: string;
  employee_id: string;
  role: 'super_admin' | 'company_admin' | 'store_admin' | 'cashier' | 'cook' | 'server';
  status: 'active' | 'disabled';
  store_name?: string;
  company_name?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  role: string;
  storeId?: number;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: string;
  storeId?: number;
  status: string;
}

export interface CreateTableRequest {
  tableNumber: string;
  status?: string;
  tabletUrl?: string;
}

export interface UpdateTableRequest {
  tableNumber: string;
  status: string;
  tabletUrl?: string;
}

export interface CreateCategoryRequest {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name: string;
  sortOrder?: number;
}

export const adminApi = {
  // ==================== USER MANAGEMENT ====================

  getUsers: async (filters?: { role?: string; status?: string; storeId?: number }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.storeId) params.append('storeId', filters.storeId.toString());

    const response = await apiClient.get<ApiResponse<User[]>>('/admin/users', { params });
    return response.data.data;
  },

  getUser: async (userId: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/admin/users/${userId}`);
    return response.data.data;
  },

  createUser: async (data: CreateUserRequest): Promise<{ userId: number }> => {
    const response = await apiClient.post<ApiResponse<{ userId: number }>>('/admin/users', data);
    return response.data.data;
  },

  updateUser: async (userId: number, data: UpdateUserRequest): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}`, data);
  },

  resetUserPassword: async (userId: number, password: string): Promise<void> => {
    await apiClient.put(`/admin/users/${userId}/password`, { password });
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  // ==================== TABLE MANAGEMENT ====================

  getTables: async (status?: string): Promise<any[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/tables', { params });
    return response.data.data;
  },

  getTable: async (tableId: number): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/tables/${tableId}`);
    return response.data.data;
  },

  createTable: async (data: CreateTableRequest): Promise<{ tableId: number }> => {
    const response = await apiClient.post<ApiResponse<{ tableId: number }>>('/admin/tables', data);
    return response.data.data;
  },

  updateTable: async (tableId: number, data: UpdateTableRequest): Promise<void> => {
    await apiClient.put(`/admin/tables/${tableId}`, data);
  },

  deleteTable: async (tableId: number): Promise<void> => {
    await apiClient.delete(`/admin/tables/${tableId}`);
  },

  // ==================== CATEGORY MANAGEMENT ====================

  createCategory: async (data: CreateCategoryRequest): Promise<{ categoryId: number }> => {
    const response = await apiClient.post<ApiResponse<{ categoryId: number }>>('/admin/categories', data);
    return response.data.data;
  },

  updateCategory: async (categoryId: number, data: UpdateCategoryRequest): Promise<void> => {
    await apiClient.put(`/admin/categories/${categoryId}`, data);
  },

  deleteCategory: async (categoryId: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${categoryId}`);
  },

  // ==================== MENU MANAGEMENT ====================

  getMenuItems: async (categoryId?: number): Promise<any[]> => {
    const params = categoryId ? { categoryId } : {};
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/menu/items', { params });
    return response.data.data;
  },

  updateMenuItemStatus: async (itemId: number, status: string): Promise<void> => {
    await apiClient.put(`/admin/menu/items/${itemId}/status`, { status });
  },

  // ==================== STORES ====================

  getStores: async (): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/stores');
    return response.data.data;
  },
};
