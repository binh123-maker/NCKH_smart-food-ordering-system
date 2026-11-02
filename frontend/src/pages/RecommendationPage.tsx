import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Brain, Plus, Flame, Dumbbell } from "lucide-react";
import { MatchScoreIndicator } from "../components/ui/MatchScoreIndicator";
import { MacroBadge } from "../components/ui/MacroBadge";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { formatVND } from "../lib/utils";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import { recommendationService } from "../services/recommendationService";
import { FoodRecommendationItem } from "../types";
import { MOCK_RECOMMENDATIONS } from "../data/mockData";

export const RecommendationPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [recommendations, setRecommendations] = useState<FoodRecommendationItem[]>([]);
  const [modelVersion, setModelVersion] = useState<string>("v1.0.4-hybrid");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterGoal, setFilterGoal] = useState<"ALL" | "PROTEIN" | "LOW_CALO" | "VEGAN">("ALL");
  const [maxCaloFilter, setMaxCaloFilter] = useState<number>(800);

  useEffect(() => {
    setIsLoading(true);
    recommendationService
      .getHomeFeedRecommendations(12)
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setRecommendations(res.items);
          if (res.model_version) setModelVersion(res.model_version);
        } else {
          setRecommendations(MOCK_RECOMMENDATIONS);
        }
      })
      .catch(() => {
        setRecommendations(MOCK_RECOMMENDATIONS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredRecs = recommendations.filter((item) => {
    if (filterGoal === "PROTEIN" && (item.protein || 0) < 30) return false;
    if (filterGoal === "LOW_CALO" && (item.calories || 0) > 450) return false;
    if (item.calories && item.calories > maxCaloFilter) return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8 space-y-10">
      {/* 1. Header with AI Explanation */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30 text-xs font-bold">
            <Brain className="h-4 w-4 text-violet-300" />
            <span>Mô hình Hybrid Recommender System ({modelVersion})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Gợi ý Món ăn Cá nhân hóa theo Dinh dưỡng & Khẩu vị
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Hệ thống phân tích lịch sử tương tác, đánh giá sao, và vector hóa các chỉ số dinh dưỡng (Calories, Protein, Fat, Carbs) để đưa ra danh sách đề xuất tối ưu nhất cho bạn.
          </p>

          {user && (
            <div className="pt-2 flex items-center gap-4 text-xs text-violet-200">
              <span>
                Khách hàng: <strong className="text-white">{user.full_name || user.email}</strong>
              </span>
              <span>•</span>
              <span>
                Mục tiêu: <strong className="text-emerald-400">Dinh dưỡng cân bằng & Chuẩn macro</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. AI FILTERS & CRITERIA BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Goal buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterGoal("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterGoal === "ALL"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả gợi ý AI
          </button>
          <button
            onClick={() => setFilterGoal("PROTEIN")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterGoal === "PROTEIN"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Tăng cơ (Protein &ge; 30g)</span>
          </button>
          <button
            onClick={() => setFilterGoal("LOW_CALO")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterGoal === "LOW_CALO"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Ít calo (&le; 450 kcal)</span>
          </button>
        </div>

        {/* Calories slider */}
        <div className="flex items-center gap-3 w-full sm:w-64">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Calo tối đa:</span>
          <input
            type="range"
            min="300"
            max="900"
            step="50"
            value={maxCaloFilter}
            onChange={(e) => setMaxCaloFilter(Number(e.target.value))}
            className="flex-1 accent-violet-600 cursor-pointer"
          />
          <span className="text-xs font-bold text-violet-700 min-w-14 text-right">
            {maxCaloFilter} kcal
          </span>
        </div>
      </div>

      {/* 3. RECOMMENDED FOOD LIST WITH EXPLAINABLE AI */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Danh sách Món ăn Đề xuất ({filteredRecs.length} món)
          </h2>
          <span className="text-xs text-slate-400">
            Sắp xếp theo: <strong className="text-violet-600 font-bold">Điểm phù hợp cao nhất</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" text="Hệ thống AI đang tính toán vector gợi ý cá nhân..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecs.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-violet-100 shadow-sm hover:shadow-lg transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Image and Match badge */}
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-slate-100">
                    <img
                      src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <MatchScoreIndicator score={item.match_score} />
                    </div>
                  </div>

                  {/* Details */}
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    {item.restaurant_name}
                  </span>
                  <Link to={`/foods/${item.slug || item.food_id}`}>
                    <h3 className="font-extrabold text-base text-slate-800 hover:text-primary transition-colors line-clamp-1 mb-2">
                      {item.name}
                    </h3>
                  </Link>

                  {/* Explainable AI Reason Box */}
                  <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-100/80 text-violet-800 text-xs leading-relaxed space-y-1 mb-4">
                    <div className="font-bold flex items-center gap-1.5 text-violet-900">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>Lý do gợi ý (Explainable AI):</span>
                    </div>
                    <p className="text-[11px] text-violet-700 italic">"{item.match_reason}"</p>
                  </div>

                  {/* Macro Nutrition Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.calories && <MacroBadge type="calories" value={item.calories} />}
                    {item.protein && <MacroBadge type="protein" value={item.protein} />}
                    {item.fat && <MacroBadge type="fat" value={item.fat} />}
                    {item.carbohydrates && <MacroBadge type="carbs" value={item.carbohydrates} />}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-xl font-black text-primary">{formatVND(item.price)}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Đã bao gồm thuế VAT</span>
                  </div>

                  <Button
                    onClick={() =>
                      addItem({
                        id: item.food_id,
                        name: item.name,
                        slug: item.slug || item.food_id,
                        price: item.price,
                        is_available: true,
                        rating_average: item.rating_average,
                        total_reviews: 0,
                        order_count: 0,
                        image_url: item.image_url,
                      })
                    }
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Chọn món này</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
