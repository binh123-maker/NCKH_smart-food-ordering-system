import apiClient from "../lib/axios";
import { FoodRecommendationItem } from "../types";

export interface RecParams {
  limit?: number;
  max_calories?: number;
  min_protein?: number;
  max_price?: number;
}

export const recommendationService = {
  async getHomeFeedRecommendations(params?: RecParams | number): Promise<{
    model_version: string;
    recommendation_type: string;
    items: FoodRecommendationItem[];
  }> {
    const queryParams = typeof params === "number" ? { limit: params } : (params || { limit: 10 });
    const res = await apiClient.get("/recommendations/home-feed", { params: queryParams });
    return res.data.data;
  },

  async getSimilarFoods(foodId: string, limit = 4): Promise<{ model_version: string; items: FoodRecommendationItem[] }> {
    const res = await apiClient.get(`/recommendations/similar/${foodId}`, { params: { limit } });
    return res.data.data;
  },
};

