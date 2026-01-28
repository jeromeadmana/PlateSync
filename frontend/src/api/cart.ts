import apiClient from './client';
import type { ApiResponse, Cart, CartItem } from '../types';

export const cartApi = {
  /**
   * Get cart by ID (for server to view/edit customer cart)
   */
  getCart: async (cartId: number): Promise<Cart> => {
    const response = await apiClient.get<ApiResponse<Cart>>(`/orders/cart/${cartId}`);
    return response.data.data;
  },

  /**
   * Add item to cart (server can add items during review)
   */
  addItem: async (
    cartId: number,
    item: {
      menuItemId: number;
      quantity: number;
      modifiers?: Array<{ id: number; name: string; extra_price: number }>;
      specialInstructions?: string;
    }
  ): Promise<{ itemId: number }> => {
    // We need to use the customer cart endpoint but with server auth
    // For now, we'll create a workaround endpoint
    const response = await apiClient.post<ApiResponse<{ itemId: number }>>(
      `/orders/cart/${cartId}/items`,
      item
    );
    return response.data.data;
  },

  /**
   * Update cart item quantity
   */
  updateItem: async (
    cartId: number,
    itemId: number,
    updates: {
      quantity?: number;
      specialInstructions?: string;
    }
  ): Promise<void> => {
    await apiClient.put(`/orders/cart/${cartId}/items/${itemId}`, updates);
  },

  /**
   * Remove item from cart
   */
  removeItem: async (cartId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/orders/cart/${cartId}/items/${itemId}`);
  },
};
