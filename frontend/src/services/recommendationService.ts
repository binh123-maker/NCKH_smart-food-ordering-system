import apiClient from "../lib/axios";
import { FoodRecommendationItem } from "../types";

export const recommendationService = {
  async getHomeFeedRecommendations(limit = 10): Promise<{ model_version: string; items: FoodRecommendationItem[] }> {
    const res = await apiClient.get("/recommendations/home-feed", { params: { limit } });
    return res.data.data;
  },

  async getSimilarFoods(foodId: string, limit = 4): Promise<{ model_version: string; items: FoodRecommendationItem[] }> {
    const res = await apiClient.get(`/recommendations/similar/${foodId}`, { params: { limit } });
    return res.data.data;
  },
};

