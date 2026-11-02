import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw } from "lucide-react";
import { FoodCard } from "../components/common/FoodCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { formatVND } from "../lib/utils";
import { foodService } from "../services/foodService";
import { Food, Category } from "../types";
import { MOCK_CATEGORIES, MOCK_FOODS } from "../data/mockData";

export const FoodListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");

  // State
  const [foods, setFoods] = useState<Food[]>(MOCK_FOODS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(150000);
  const [maxCalories, setMaxCalories] = useState<number>(800);
  const [minProtein, setMinProtein] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("popular");

  useEffect(() => {
    foodService.getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // Find category id if selectedCategory is slug
    const matchedCategory = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
    const categoryId = matchedCategory ? matchedCategory.id : undefined;

    foodService
      .getFoods({
        category_id: categoryId,
        max_price: maxPrice,
        max_calories: maxCalories,
        min_protein: minProtein > 0 ? minProtein : undefined,
        min_rating: minRating > 0 ? minRating : undefined,
        sort_by: sortBy,
      })
      .then((res) => {
        if (res && res.items) {
          setFoods(res.items);
        }
      })
      .catch(() => {
        // Fallback filter locally on mock data
        const fallback = MOCK_FOODS.filter((food) => {
          if (selectedCategory && food.category?.slug !== selectedCategory && food.category_id !== selectedCategory) {
            return false;
          }
          if (food.price > maxPrice) return false;
          if (food.nutrition && food.nutrition.calories > maxCalories) return false;
          if (food.nutrition && food.nutrition.protein < minProtein) return false;
          if (food.rating_average < minRating) return false;
          return true;
        });
        setFoods(fallback);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedCategory, maxPrice, maxCalories, minProtein, minRating, sortBy, categories]);

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
              className="text-[11px] text-slate-400 hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
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
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === null
                    ? "bg-orange-50 text-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tất cả danh mục
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    selectedCategory === c.slug
                      ? "bg-orange-50 text-primary font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{c.icon_url || "🍲"}</span>
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
                Đạm tối thiểu (g)
              </h3>
              <span className="text-xs font-bold text-emerald-600">≥ {minProtein} g</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={minProtein}
              onChange={(e) => setMinProtein(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* 5. Star Rating Filter */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Đánh giá từ khách hàng
            </h3>
            <div className="flex gap-2">
              {[0, 4, 4.5].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setMinRating(stars)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    minRating === stars
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {stars === 0 ? "Tất cả" : `★ ${stars}+`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: FOODS GRID & SORTING */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Sort Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-600 font-medium">
              Tìm thấy <strong className="text-slate-900 font-bold">{foods.length}</strong> món ăn phù hợp
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 outline-none focus:border-primary cursor-pointer"
              >
                <option value="popular">Bán chạy nhất (Phổ biến)</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {/* Food Cards Grid */}
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" text="Đang tải danh sách món ăn..." />
            </div>
          ) : foods.length === 0 ? (
            <EmptyState
              title="Không tìm thấy món ăn phù hợp"
              description="Hãy thử nới lỏng mức calo, ngân sách hoặc chọn danh mục khác."
              actionLabel="Đặt lại bộ lọc"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {foods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
