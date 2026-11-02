import apiClient from "../lib/axios";
import { Order, Food } from "../types";

export interface RecsysModelVersion {
  version_code: string;
  algorithm_type: string;
  ndcg_at_k: number;
  precision_at_k: number;
  recall_at_k: number;
  map_at_k: number;
  coverage_rate: number;
  is_active: boolean;
  trained_at: string;
}

export const adminService = {
  async getDashboardKpis() {
    const res = await apiClient.get("/admin/dashboard");
    return res.data.data;
  },

  async getAllOrders(status?: string, page = 1, limit = 20): Promise<{ items: Order[]; total: number }> {
    const res = await apiClient.get("/admin/orders", { params: { status, page, limit } });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data || []).length,
    };
  },

  async getRecsysMetrics(): Promise<{ active_model: string; model_versions: RecsysModelVersion[] }> {
    const res = await apiClient.get("/admin/recsys-metrics");
    return res.data.data;
  },

  async updateOrderStatus(orderId: string, newStatus: string): Promise<Order> {
    const res = await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
    return res.data.data;
  },

  async createFood(foodData: any): Promise<Food> {
    const res = await apiClient.post("/foods", foodData);
    return res.data.data;
  },

  async updateFood(foodId: string, foodData: any): Promise<Food> {
    const res = await apiClient.put(`/foods/${foodId}`, foodData);
    return res.data.data;
  },

  async deleteFood(foodId: string): Promise<void> {
    await apiClient.delete(`/foods/${foodId}`);
  },
};

