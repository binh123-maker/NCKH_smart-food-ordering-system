import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Minus, ShoppingBag, Store, Clock, Heart, Sparkles, ChefHat } from "lucide-react";
import { MOCK_FOODS } from "../data/mockData";
import { formatVND } from "../lib/utils";
import { StarRating } from "../components/ui/StarRating";
import { MacroBadge } from "../components/ui/MacroBadge";
import { Button } from "../components/ui/Button";
import { FoodCard } from "../components/common/FoodCard";
import { useCartStore } from "../stores/cartStore";

export const FoodDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCartStore();

  const food = MOCK_FOODS.find((f) => f.slug === slug) || MOCK_FOODS[0];
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"similar" | "reviews">("similar");
  const [isFavorite, setIsFavorite] = useState(false);

  // Similar foods (Content-based mock)
  const similarFoods = MOCK_FOODS.filter((f) => f.id !== food.id).slice(0, 3);

  const handleAddToCart = () => {
    addItem(food, quantity, notes);
  };

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8 space-y-12">
      {/* Top Breadcrumb */}
      <nav className="text-xs text-slate-400 flex items-center gap-2">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <Link to="/foods" className="hover:text-primary">Thực đơn</Link>
        <span>/</span>
        <span className="text-slate-700 font-semibold truncate">{food.name}</span>
      </nav>

      {/* Main Detail Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery */}
        <div className="md:col-span-6 space-y-3">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 shadow-md border border-slate-100 relative">
            <img
              src={food.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
              alt={food.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm text-slate-600 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
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
              <span className="text-xs text-slate-500">Đã bán: <strong>{food.order_count}</strong> phần</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-primary">
              {formatVND(food.price)}
            </span>
            {food.original_price && (
              <span className="text-sm text-slate-400 line-through">
                {formatVND(food.original_price)}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {food.description || "Món ăn được tuyển chọn nguyên liệu tươi ngon mỗi ngày, chế biến theo quy chuẩn an toàn vệ sinh thực phẩm."}
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
                  <span className="text-sm font-extrabold text-orange-600 block">{food.nutrition.calories}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Calories</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-sm font-extrabold text-emerald-600 block">{food.nutrition.protein}g</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Protein</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-sm font-extrabold text-amber-600 block">{food.nutrition.fat}g</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Chất béo</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-sm font-extrabold text-sky-600 block">{food.nutrition.carbohydrates}g</span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Carbs</span>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients */}
          {food.ingredients && (
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">Thành phần nguyên liệu chính:</span>
              <div className="flex flex-wrap gap-1.5">
                {food.ingredients.map((ing) => (
                  <span key={ing} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú món ăn (Ví dụ: Ít cay, không lấy hành...)"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary"
            />

            <div className="flex items-center gap-4">
              {/* Quantity selector */}
              <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-800 min-w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add Button */}
              <Button onClick={handleAddToCart} className="flex-1" size="lg">
                <ShoppingBag className="h-5 w-5" />
                <span>Thêm vào giỏ - {formatVND(food.price * quantity)}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Similar Foods & Reviews */}
      <div className="pt-8 border-t border-slate-200">
        <div className="flex gap-4 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("similar")}
            className={`text-sm font-bold pb-2 transition-colors relative cursor-pointer ${
              activeTab === "similar" ? "text-primary border-b-2 border-primary -mb-3" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Món ăn tương tự (Content-Based)
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`text-sm font-bold pb-2 transition-colors relative cursor-pointer ${
              activeTab === "reviews" ? "text-primary border-b-2 border-primary -mb-3" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Đánh giá từ khách hàng ({food.total_reviews})
          </button>
        </div>

        <div className="pt-6">
          {activeTab === "similar" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {similarFoods.map((simFood) => (
                <FoodCard key={simFood.id} food={simFood} />
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {[
                { name: "Phạm Hải Đăng", rating: 5, date: "2 ngày trước", text: "Món ăn giao nhanh, ức gà mềm mọng không hề bị khô. Điểm dinh dưỡng rất rõ ràng!" },
                { name: "Trần Mai Anh", rating: 5, date: "1 tuần trước", text: "Gạo lứt dẻo, sốt mè rang béo ngậy vừa miệng. Sẽ đặt lại thường xuyên." },
              ].map((rev, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{rev.name}</span>
                    <span className="text-[11px] text-slate-400">{rev.date}</span>
                  </div>
                  <StarRating rating={rev.rating} size="sm" />
                  <p className="text-xs text-slate-600">{rev.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

