import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal, RotateCcw } from "lucide-react";
import { MOCK_CATEGORIES, MOCK_FOODS } from "../data/mockData";
import { FoodCard } from "../components/common/FoodCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { formatVND } from "../lib/utils";

export const FoodListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [maxCalories, setMaxCalories] = useState<number>(800);
  const [minProtein, setMinProtein] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("popular");

  // Filtering Logic
  const filteredFoods = MOCK_FOODS.filter((food) => {
    if (selectedCategory && food.category?.slug !== selectedCategory && food.category_id !== selectedCategory) {
      return false;
    }
    if (food.price > maxPrice) return false;
    if (food.nutrition && food.nutrition.calories > maxCalories) return false;
    if (food.nutrition && food.nutrition.protein < minProtein) return false;
    if (food.rating_average < minRating) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "rating") return b.rating_average - a.rating_average;
    return b.order_count - a.order_count;
  });

  const resetFilters = () => {
    setSelectedCategory(null);
    setMaxPrice(150000);
    setMaxCalories(800);
    setMinProtein(0);
    setMinRating(0);
    setSortBy("popular");
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800">Thực đơn Món ăn</h1>
        <p className="text-xs text-slate-500 mt-1">
          Lọc món ăn theo giá cả, dinh dưỡng và xếp hạng sao để chọn bữa ăn phù hợp nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* LEFT COLUMN: MULTI-FACETED FILTER SIDEBAR */}
        <aside className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-6 sticky top-22">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-slate-800 text-sm">Bộ lọc nâng cao</h2>
            </div>
            <button
              onClick={resetFilters}
              title="Đặt lại"
              className="text-[11px] text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Đặt lại</span>
            </button>
          </div>

          {/* 1. Category Filter */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Danh mục ẩm thực
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === null
                    ? "bg-orange-50 text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tất cả danh mục
              </button>
              {MOCK_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedCategory === c.slug
                      ? "bg-orange-50 text-primary font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{c.icon_url}</span>
                    <span>{c.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Filter */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mức giá tối đa
              </h3>
              <span className="text-xs font-extrabold text-primary">{formatVND(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="30000"
              max="150000"
              step="5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* 3. Nutrition Filter: Calories */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Calo tối đa (kcal)
              </h3>
              <span className="text-xs font-bold text-orange-600">≤ {maxCalories} kcal</span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              step="50"
              value={maxCalories}
              onChange={(e) => setMaxCalories(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* 4. Nutrition Filter: Protein */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Đạm tối thiểu (Protein)
              </h3>
              <span className="text-xs font-bold text-emerald-600">≥ {minProtein}g</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={minProtein}
              onChange={(e) => setMinProtein(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* 5. Star Rating Filter */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Đánh giá sao
            </h3>
            <div className="flex gap-2">
              {[0, 4, 4.5].map((star) => (
                <button
                  key={star}
                  onClick={() => setMinRating(star)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    minRating === star
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {star === 0 ? "Tất cả" : `${star}★+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: FOOD GRID */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              Tìm thấy <strong className="text-primary">{filteredFoods.length}</strong> món ăn
            </span>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-primary cursor-pointer"
              >
                <option value="popular">Bán chạy nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {/* Food Cards */}
          {filteredFoods.length === 0 ? (
            <EmptyState
              title="Không có món ăn phù hợp"
              description="Hãy thử nới lỏng mức calo hoặc khoảng giá để tìm thấy nhiều món ăn ngon hơn."
              actionText="Xóa toàn bộ bộ lọc"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFoods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

