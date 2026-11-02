import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CustomerLayout } from "../components/layout/CustomerLayout";
import { AdminLayout } from "../components/layout/AdminLayout";

// Customer Pages
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { RestaurantListingPage } from "../pages/RestaurantListingPage";
import { FoodListingPage } from "../pages/FoodListingPage";
import { FoodDetailPage } from "../pages/FoodDetailPage";
import { SearchPage } from "../pages/SearchPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrderHistoryPage } from "../pages/OrderHistoryPage";
import { RecommendationPage } from "../pages/RecommendationPage";
import { UserProfilePage } from "../pages/UserProfilePage";

// Admin Pages
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AdminFoodManagementPage } from "../pages/AdminFoodManagementPage";
import { AdminOrderManagementPage } from "../pages/AdminOrderManagementPage";
import { AdminRestaurantPage } from "../pages/AdminRestaurantPage";
import { AdminRecsysPage } from "../pages/AdminRecsysPage";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Customer / Public Routes wrapped in CustomerLayout */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/restaurants" element={<RestaurantListingPage />} />
        <Route path="/foods" element={<FoodListingPage />} />
        <Route path="/foods/:id" element={<FoodDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/recommendations" element={<RecommendationPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Route>

      {/* Admin Routes wrapped in AdminLayout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="foods" element={<AdminFoodManagementPage />} />
        <Route path="orders" element={<AdminOrderManagementPage />} />
        <Route path="restaurants" element={<AdminRestaurantPage />} />
        <Route path="recsys" element={<AdminRecsysPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

