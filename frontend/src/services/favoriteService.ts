import apiClient from "../lib/axios";
import { Food } from "../types";

export const favoriteService = {
  async toggleFavorite(foodId: string): Promise<{ is_favorite: boolean; food_id: string }> {
    const res = await apiClient.post(`/favorites/toggle/${foodId}`);
    return res.data.data;
  },

  async getFavorites(page = 1, limit = 20): Promise<{ items: Food[]; total: number }> {
    const res = await apiClient.get("/favorites", { params: { page, limit } });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data || []).length,
    };
  },
};

