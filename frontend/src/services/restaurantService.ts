import apiClient from "../lib/axios";
import { Restaurant } from "../types";

export interface ListRestaurantsParams {
  search?: string;
  is_active?: boolean;
  sort_by?: string;
  page?: number;
  limit?: number;
}

export const restaurantService = {
  async getRestaurants(params?: ListRestaurantsParams): Promise<{ items: Restaurant[]; total: number }> {
    const res = await apiClient.get("/restaurants", { params });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data || []).length,
    };
  },

  async getRestaurantById(idOrSlug: string): Promise<Restaurant> {
    const res = await apiClient.get(`/restaurants/${idOrSlug}`);
    return res.data.data;
  },

  async createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const res = await apiClient.post("/restaurants", data);
    return res.data.data;
  },

  async updateRestaurant(restaurantId: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const res = await apiClient.put(`/restaurants/${restaurantId}`, data);
    return res.data.data;
  },

  async deleteRestaurant(restaurantId: string): Promise<void> {
    await apiClient.delete(`/restaurants/${restaurantId}`);
  },
};

