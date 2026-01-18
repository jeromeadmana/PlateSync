import apiClient from './client';
import type { ApiResponse, LoginResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  quickLogin: async (companyId: number, employeeId: string): Promise<User> => {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/quick-login', {
      companyId,
      employeeId,
    });
    return response.data.data.user;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  getEmployees: async (companyId?: number, storeId?: number): Promise<User[]> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId.toString());
    if (storeId) params.append('storeId', storeId.toString());

    const response = await apiClient.get<ApiResponse<User[]>>('/auth/employees', { params });
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
