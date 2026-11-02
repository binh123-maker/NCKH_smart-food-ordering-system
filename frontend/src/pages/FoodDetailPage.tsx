import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Minus, Store, Clock, Heart, Sparkles, ChefHat } from "lucide-react";
import { MOCK_FOODS } from "../data/mockData";
import { formatVND } from "../lib/utils";
import { StarRating } from "../components/ui/StarRating";
import { Button } from "../components/ui/Button";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { FoodCard } from "../components/common/FoodCard";
import { useCartStore } from "../stores/cartStore";
import { foodService } from "../services/foodService";
import { reviewService } from "../services/reviewService";
import { favoriteService } from "../services/favoriteService";
import { recommendationService } from "../services/recommendationService";
import { Food, FoodRecommendationItem } from "../types";

export const FoodDetailPage: React.FC = () => {
  const params = useParams();
  const idOrSlug = params.id || params.slug || "food-1";
  const { addItem } = useCartStore();

  const [food, setFood] = useState<Food | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"similar" | "reviews">("similar");
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [similarFoods, setSimilarFoods] = useState<Food[]>([]);

  useEffect(() => {
    setIsLoading(true);
    foodService
      .getFoodById(idOrSlug)
      .then((data) => {
        if (data) {
          setFood(data);
          // Fetch similar foods
          recommendationService
            .getSimilarFoods(data.id, 3)
            .then((sim) => {
              if (sim && sim.items) {
                // map to foods or fallback
                const simIds = sim.items.map((i) => i.food_id);
                const matched = MOCK_FOODS.filter((f) => simIds.includes(f.id));
                setSimilarFoods(matched.length > 0 ? matched : MOCK_FOODS.slice(0, 3));
              }
            })
            .catch(() => {
              setSimilarFoods(MOCK_FOODS.slice(0, 3));
            });

          // Fetch reviews
          reviewService
            .getFoodReviews(data.id)
            .then((res) => {
              if (res && res.items) setReviews(res.items);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // Fallback
        const fallback =
          MOCK_FOODS.find((f) => f.id === idOrSlug || f.slug === idOrSlug) || MOCK_FOODS[0];
        setFood(fallback);
        setSimilarFoods(MOCK_FOODS.filter((f) => f.id !== fallback.id).slice(0, 3));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [idOrSlug]);

  const handleToggleFavorite = async () => {
    if (!food) return;
    try {
      const res = await favoriteService.toggleFavorite(food.id);
      setIsFavorite(res.is_favorite);
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  const handleAddToCart = () => {
    if (food) {
      addItem(food, quantity, notes);
    }
  };

  if (isLoading || !food) {
    return (
      <div className="py-24 flex justify-center">
        <LoadingSpinner size="lg" text="Đang tải thông tin món ăn..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8 space-y-12">
      {/* Top Breadcrumb */}
      <nav className="text-xs text-slate-400 flex items-center gap-2">
        <Link to="/" className="hover:text-primary">
          Trang chủ
        </Link>
        <span>/</span>
        <Link to="/foods" className="hover:text-primary">
          Thực đơn
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-semibold truncate">{food.name}</span>
      </nav>

      {/* Main Detail Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery */}
        <div className="md:col-span-6 space-y-3">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 shadow-md border border-slate-100 relative">
            <img
              src={
                food.image_url ||
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
              }
              alt={food.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleToggleFavorite}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm text-slate-600 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Right: Info & Controls */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <Store className="h-3.5 w-3.5 text-primary" />
              <Link to="/restaurants" className="font-semibold text-slate-700 hover:text-primary">
                {food.restaurant?.name || "Nhà hàng đối tác"}
              </Link>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>15-25 phút</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {food.name}
            </h1>

            <div className="flex items-center gap-4 mt-2">
              <StarRating rating={food.rating_average} totalReviews={food.total_reviews} />
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500">
                Đã bán: <strong>{food.order_count}</strong> phần
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-primary">{formatVND(food.price)}</span>
            {food.original_price && food.original_price > food.price && (
              <span className="text-sm text-slate-400 line-through">
                {formatVND(food.original_price)}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {food.description ||
              "Món ăn được tuyển chọn nguyên liệu tươi ngon mỗi ngày, chế biến theo quy chuẩn an toàn vệ sinh thực phẩm."}
          </p>

          {/* NUTRITION FACTS WIDGET (Feature for RecSys / Healthy Food) */}
          {food.nutrition && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Bảng giá trị dinh dưỡng (Macro Profile)
                </span>
                <span className="text-[11px] text-slate-400">Khẩu phần 1 người</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-sm font-extrabold text-orange-600 block">
                    {food.nutrition.calories}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Calories</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-sm font-extrabold text-emerald-600 block">
                    {food.nutrition.protein}g
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Protein</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-sm font-extrabold text-amber-600 block">
                    {food.nutrition.fat}g
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Chất béo</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-sm font-extrabold text-sky-600 block">
                    {food.nutrition.carbohydrates}g
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Carbs</span>
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <input
              type="text"
              placeholder="Ghi chú cho quán (VD: ít cay, không hành, sốt riêng...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-primary placeholder:text-slate-400"
            />

            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-8 w-8 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-xs text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-8 w-8 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add Button */}
              <Button onClick={handleAddToCart} size="lg" className="flex-1 shadow-md">
                <span>Thêm vào giỏ hàng • {formatVND(food.price * quantity)}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Similar Foods vs Reviews */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab("similar")}
            className={`text-sm font-bold pb-2 transition-colors cursor-pointer ${
              activeTab === "similar"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Món ăn tương tự (Content-Based)
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`text-sm font-bold pb-2 transition-colors cursor-pointer ${
              activeTab === "reviews"
                ? "text-primary border-b-2 border-primary"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Đánh giá từ khách hàng ({reviews.length})
          </button>
        </div>

        {activeTab === "similar" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {similarFoods.map((simFood) => (
              <FoodCard key={simFood.id} food={simFood} />
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Chưa có đánh giá nào cho món ăn này. Hãy là người đầu tiên thưởng thức và đánh giá!
              </p>
            ) : (
              reviews.map((rev, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{rev.user_name || "Khách hàng"}</span>
                    <span className="text-amber-500 font-bold">★ {rev.rating}</span>
                  </div>
                  <p className="text-slate-600">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
