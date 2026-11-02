import React, { useState, useEffect } from "react";
import { Search, Store, SlidersHorizontal } from "lucide-react";
import { restaurantService } from "../services/restaurantService";
import { Restaurant } from "../types";
import { RestaurantCard } from "../components/common/RestaurantCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { MOCK_RESTAURANTS } from "../data/mockData";

export const RestaurantListingPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "name">("rating");

  useEffect(() => {
    setIsLoading(true);
    restaurantService
      .getRestaurants({ search: search || undefined })
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setRestaurants(res.items);
        } else {
          setRestaurants(MOCK_RESTAURANTS);
        }
      })
      .catch(() => {
        setRestaurants(MOCK_RESTAURANTS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [search]);

  const sortedRestaurants = [...restaurants].sort((a, b) => {
    if (sortBy === "rating") return b.rating_average - a.rating_average;
    if (sortBy === "distance") return (a.distance_km || 0) - (b.distance_km || 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black text-slate-800">Danh sách Nhà hàng đối tác</h1>
        </div>
        <p className="text-xs text-slate-500">
          Khám phá những quán ăn chất lượng, đảm bảo vệ sinh an toàn thực phẩm và hỗ trợ giao hàng siêu tốc.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên quán, địa chỉ..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Sắp xếp:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "rating" | "distance" | "name")}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-primary cursor-pointer"
          >
            <option value="rating">Đánh giá cao nhất</option>
            <option value="distance">Gần tôi nhất</option>
            <option value="name">Tên A - Z</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Đang tải danh sách nhà hàng..." />
        </div>
      ) : sortedRestaurants.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhà hàng nào"
          description="Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."
          actionLabel="Xóa tìm kiếm"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
};
