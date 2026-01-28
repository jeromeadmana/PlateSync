import apiClient from './client';
import type { ApiResponse, Order, Cart } from '../types';

export const ordersApi = {
  getPendingReviews: async (): Promise<Cart[]> => {
    const response = await apiClient.get<ApiResponse<Cart[]>>('/orders/pending-reviews');
    return response.data.data;
  },

  getCartForReview: async (cartId: number): Promise<Cart> => {
    const response = await apiClient.get<ApiResponse<Cart>>(`/orders/cart/${cartId}`);
    return response.data.data;
  },

  submitToKitchen: async (cartId: number): Promise<{ orderId: number; orderNumber: string }> => {
    const response = await apiClient.post<ApiResponse<{ orderId: number; orderNumber: string }>>(
      `/orders/cart/${cartId}/submit`
    );
    return response.data.data;
  },

  getOrders: async (filters?: {
    status?: string;
    serverId?: number;
    limit?: number;
  }): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.serverId) params.append('serverId', filters.serverId.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ApiResponse<Order[]>>('/orders', { params });
    return response.data.data;
  },

  getKitchenOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<ApiResponse<Order[]>>('/orders/kitchen');
    return response.data.data;
  },

  getOrder: async (orderId: number): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  },

  updateOrderStatus: async (orderId: number, status: string): Promise<void> => {
    await apiClient.put(`/orders/${orderId}/status`, { status });
  },

  updateOrderItemStatus: async (itemId: number, status: string): Promise<void> => {
    await apiClient.put(`/orders/items/${itemId}/status`, { status });
  },

  createManualOrder: async (
    tableId: number,
    items: Array<{
      menuItemId: number;
      quantity: number;
      modifiers?: Array<{ id: number; name: string; extra_price: number }>;
      specialInstructions?: string;
    }>
  ): Promise<{ orderId: number; orderNumber: string; totalAmount: number }> => {
    const response = await apiClient.post<ApiResponse<{
      orderId: number;
      orderNumber: string;
      totalAmount: number;
    }>>('/orders', { tableId, items });
    return response.data.data;
  },
};
