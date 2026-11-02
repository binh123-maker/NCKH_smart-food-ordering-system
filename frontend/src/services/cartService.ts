import apiClient from "../lib/axios";
import { Cart } from "../types";

export interface AddToCartDTO {
  food_id: string;
  quantity?: number;
  notes?: string;
}

export interface UpdateCartItemDTO {
  quantity: number;
  notes?: string;
}

export const cartService = {
  async getCart(): Promise<Cart> {
    const res = await apiClient.get("/cart");
    return res.data.data;
  },

  async addItem(data: AddToCartDTO): Promise<Cart> {
    const res = await apiClient.post("/cart/items", data);
    return res.data.data;
  },

  async updateItem(itemId: string, data: UpdateCartItemDTO): Promise<Cart> {
    const res = await apiClient.put(`/cart/items/${itemId}`, data);
    return res.data.data;
  },

  async removeItem(itemId: string): Promise<Cart> {
    const res = await apiClient.delete(`/cart/items/${itemId}`);
    return res.data.data;
  },

  async clearCart(): Promise<void> {
    await apiClient.delete("/cart");
  },
};

