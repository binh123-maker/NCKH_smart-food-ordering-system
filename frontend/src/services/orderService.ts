import apiClient from "../lib/axios";
import { Order } from "../types";

export interface CreateOrderDTO {
  address_id: string;
  payment_method: string;
  delivery_notes?: string;
}

export const orderService = {
  async createOrder(data: CreateOrderDTO): Promise<Order> {
    const res = await apiClient.post("/orders", data);
    return res.data.data;
  },

  async getOrders(params?: { status?: string; page?: number; limit?: number }): Promise<{ items: Order[]; total: number }> {
    const res = await apiClient.get("/orders", { params });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data || []).length,
    };
  },

  async getOrderById(orderId: string): Promise<Order> {
    const res = await apiClient.get(`/orders/${orderId}`);
    return res.data.data;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const res = await apiClient.post(`/orders/${orderId}/cancel`, null, { params: { reason } });
    return res.data.data;
  },
};
