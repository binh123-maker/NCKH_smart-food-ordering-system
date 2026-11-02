export type UserRole = "CUSTOMER" | "ADMIN" | "STAFF";

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  full_name?: string | null;
  avatar_url?: string | null;
  is_onboarded?: boolean;
}

export interface UserAddress {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  address_line: string;
  ward?: string | null;
  district?: string | null;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
}

export interface UserPreference {
  preferred_categories: string[];
  budget_per_meal?: number | null;
  daily_calorie_target?: number | null;
  preferred_protein_min?: number | null;
  dietary_restrictions: string[];
  is_onboarded: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  phone: string;
  email?: string | null;
  opening_hours: string;
  rating_average: number;
  total_reviews: number;
  is_active: boolean;
  image_url?: string;
  distance_km?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  sort_order: number;
}

export interface FoodNutrition {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber?: number;
  sodium?: number;
}

export interface Food {
  id: string;
  restaurant_id?: string;
  category_id?: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  is_available: boolean;
  image_url?: string | null;
  rating_average: number;
  total_reviews: number;
  order_count: number;
  preparation_time_minutes?: number;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  nutrition?: FoodNutrition | null;
  ingredients?: string[];
  images?: { id: string; image_url: string; is_primary: boolean }[];
}

export interface CartItem {
  id: string;
  food_id: string;
  food_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_url?: string | null;
  notes?: string | null;
  is_available: boolean;
}

export interface Cart {
  id: string;
  restaurant_id?: string | null;
  restaurant_name?: string | null;
  total_items: number;
  subtotal: number;
  items: CartItem[];
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELLED";

export interface OrderItem {
  id: string;
  food_id: string;
  food_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  order_code: string;
  restaurant_id: string;
  restaurant_name: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_address?: string | null;
  delivery_notes?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  food_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string | null;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface RecommendedFoodItem {
  id: string;
  food_id: string;
  name: string;
  slug: string;
  price: number;
  image_url?: string | null;
  rating_average: number;
  restaurant_name?: string | null;
  match_score: number;
  match_reason: string;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbohydrates?: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
}

