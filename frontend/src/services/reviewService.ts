import apiClient from "../lib/axios";

export interface CreateReviewDTO {
  order_id: string;
  food_id: string;
  rating: number;
  comment?: string;
  images?: string[];
}

export const reviewService = {
  async createReview(data: CreateReviewDTO) {
    const res = await apiClient.post("/reviews", data);
    return res.data.data;
  },

  async getFoodReviews(foodId: string, page = 1, limit = 20) {
    const res = await apiClient.get(`/reviews/foods/${foodId}`, { params: { page, limit } });
    return {
      items: res.data.data || [],
      total: res.data.meta?.total || (res.data.data || []).length,
    };
  },
};

