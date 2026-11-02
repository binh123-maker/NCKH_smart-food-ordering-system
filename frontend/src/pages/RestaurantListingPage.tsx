import React, { useState } from "react";
import { Search, Store, SlidersHorizontal } from "lucide-react";
import { MOCK_RESTAURANTS } from "../data/mockData";
import { RestaurantCard } from "../components/common/RestaurantCard";
import { EmptyState } from "../components/ui/EmptyState";

export const RestaurantListingPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "name">("rating");

  const filtered = MOCK_RESTAURANTS.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.address.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
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
      {filtered.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhà hàng"
          description="Không có quán ăn nào khớp với từ khóa tìm kiếm của bạn. Hãy thử từ khóa khác!"
          actionText="Xóa bộ lọc"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
};

