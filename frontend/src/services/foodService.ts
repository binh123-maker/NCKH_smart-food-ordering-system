import apiClient from "../lib/axios";
import { Food, Category } from "../types";

export interface ListFoodsParams {
  search?: string;
  category_id?: string;
  restaurant_id?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  max_calories?: number;
  min_protein?: number;
  is_available?: boolean;
  sort_by?: string;
  page?: number;
  limit?: number;
}

export interface ListFoodsResponse {
  items: Food[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export const foodService = {
  async getFoods(params?: ListFoodsParams): Promise<{ items: Food[]; total: number }> {
    const res = await apiClient.get("/foods", { params });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data || []).length,
    };
  },

  async getFoodById(idOrSlug: string): Promise<Food> {
    const res = await apiClient.get(`/foods/${idOrSlug}`);
    return res.data.data;
  },

  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get("/categories");
    return res.data.data || [];
  },
};

