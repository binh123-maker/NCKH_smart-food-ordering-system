import apiClient from "../lib/axios";
import { UserAddress, UserPreference } from "../types";

export interface UpdateProfileDTO {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

export const userService = {
  async getProfile() {
    const res = await apiClient.get("/users/profile");
    return res.data.data;
  },

  async updateProfile(data: UpdateProfileDTO) {
    const res = await apiClient.put("/users/profile", data);
    return res.data.data;
  },

  async getPreferences(): Promise<UserPreference> {
    const res = await apiClient.get("/users/preferences");
    return res.data.data;
  },

  async updatePreferences(data: Partial<UserPreference>): Promise<UserPreference> {
    const res = await apiClient.put("/users/preferences", data);
    return res.data.data;
  },

  async getAddresses(): Promise<UserAddress[]> {
    const res = await apiClient.get("/users/addresses");
    return res.data.data;
  },

  async addAddress(data: Omit<UserAddress, "id">): Promise<UserAddress> {
    const res = await apiClient.post("/users/addresses", data);
    return res.data.data;
  },
};

