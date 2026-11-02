import apiClient from "../lib/axios";
import { User } from "../types";

export interface RegisterDTO {
  email: string;
  password: string;
  phone?: string;
  full_name?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authService = {
  async register(data: RegisterDTO): Promise<AuthTokens> {
    const res = await apiClient.post("/auth/register", data);
    return res.data.data;
  },

  async login(data: LoginDTO): Promise<AuthTokens> {
    const res = await apiClient.post("/auth/login", data);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get("/auth/me");
    return res.data.data;
  },

  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
  },
};

