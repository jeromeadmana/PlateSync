import apiClient from './client';
import type { ApiResponse } from '../types';

export interface Payment {
  id: number;
  order_id: number;
  cashier_id: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'mobile';
  tip_amount: number;
  payment_time: string;
}

export interface PaymentReceipt extends Payment {
  order_number: string;
  table_id: number;
  table_number: string;
  cashier_name: string;
  order_total: number;
  items: any[];
  subtotal: number;
  tip: number;
  total: number;
}

export interface UnpaidOrder {
  id: number;
  order_number: string;
  table_id: number;
  table_number: string;
  server_name: string;
  status: string;
  total_amount: number;
  order_time: string;
  item_count: number;
  items: any[];
}

export interface ShiftReport {
  cashierId: number;
  shiftStart: string;
  shiftEnd: string;
  payments: Payment[];
  totals: {
    cash: number;
    card: number;
    mobile: number;
    tips: number;
    count: number;
    grandTotal: number;
  };
}

export const paymentsApi = {
  /**
   * Process payment for an order
   */
  processPayment: async (
    orderId: number,
    amount: number,
    paymentMethod: 'cash' | 'card' | 'mobile',
    tipAmount: number = 0
  ): Promise<PaymentReceipt> => {
    const response = await apiClient.post<ApiResponse<PaymentReceipt>>('/payments', {
      orderId,
      amount,
      paymentMethod,
      tipAmount
    });
    return response.data.data;
  },

  /**
   * Get unpaid orders
   */
  getUnpaidOrders: async (tableId?: number): Promise<UnpaidOrder[]> => {
    const params = tableId ? { tableId } : {};
    const response = await apiClient.get<ApiResponse<UnpaidOrder[]>>('/payments/unpaid', {
      params
    });
    return response.data.data;
  },

  /**
   * Get shift report for current cashier
   */
  getShiftReport: async (startTime?: string, endTime?: string): Promise<ShiftReport> => {
    const params: any = {};
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const response = await apiClient.get<ApiResponse<ShiftReport>>('/payments/shift', {
      params
    });
    return response.data.data;
  },

  /**
   * Get payment receipt
   */
  getReceipt: async (paymentId: number): Promise<PaymentReceipt> => {
    const response = await apiClient.get<ApiResponse<PaymentReceipt>>(`/payments/${paymentId}`);
    return response.data.data;
  },

  /**
   * Get all payments (for admin/reporting)
   */
  getAllPayments: async (filters?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    limit?: number;
  }): Promise<Payment[]> => {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/payments', {
      params: filters
    });
    return response.data.data;
  },
};
