import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ShieldCheck, Flame, Heart, TrendingUp, Search } from "lucide-react";
import { MOCK_CATEGORIES, MOCK_FOODS, MOCK_RECOMMENDATIONS, MOCK_RESTAURANTS } from "../data/mockData";
import { FoodCard } from "../components/common/FoodCard";
import { RestaurantCard } from "../components/common/RestaurantCard";
import { MatchScoreIndicator } from "../components/ui/MatchScoreIndicator";
import { Button } from "../components/ui/Button";
import { formatVND } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/search?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-white pt-10 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 text-primary text-xs font-bold tracking-wide">
                <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Trí tuệ Nhân tạo Cá nhân hóa Ẩm thực</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Hôm nay bạn muốn ăn gì? <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
                  Chuẩn gu, ngon miệng & đủ calo!
                </span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
                Hệ thống đề xuất món ăn thông minh giúp bạn chọn món trong 30 giây, cân đối chính xác lượng Calo, Protein theo mục tiêu sức khỏe của bạn.
              </p>

              {/* Big Search Bar */}
              <form onSubmit={handleSearch} className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-lg border border-slate-100 max-w-lg">
                <div className="pl-3 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Gõ tên món, 'dưới 500 calo', 'nhiều đạm'..."
                  className="flex-1 h-10 px-2 text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <Button type="submit" size="md">
                  Tìm kiếm
                </Button>
              </form>

              {/* Quick tags */}
              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <span className="font-semibold text-slate-700">Gợi ý tìm kiếm:</span>
                {["Cơm ức gà", "Salad bơ", "Phở bò", "High Protein", "Eat Clean"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-primary transition-colors text-[11px]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Col: Hero Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                  alt="Món ăn tiêu biểu"
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <MatchScoreIndicator score={0.98} />
                    <span className="text-xs font-extrabold text-primary">59.000 đ</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Cơm ức gà nướng sốt mè rang
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-violet-50/70 p-2.5 rounded-xl border border-violet-100">
                    💡 <em>"Đề xuất cho bạn vì giàu protein (38g), ít calo (480 kcal), đáp ứng chuẩn mục tiêu dinh dưỡng."</em>
                  </p>
                  <Button onClick={() => navigate("/recommendations")} className="w-full" size="sm">
                    Khám phá toàn bộ thực đơn gợi ý
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COLD START ONBOARDING BANNER (If not yet completed or guest) */}
      {(!user || !user.is_onboarded) && (
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Khảo sát nhanh 30 giây</span>
              </div>
              <h3 className="text-xl font-bold">Bạn chưa thiết lập khẩu vị ẩm thực & mục tiêu dinh dưỡng?</h3>
              <p className="text-xs text-violet-100 max-w-xl leading-relaxed">
                Hãy cho hệ thống biết các món bạn yêu thích và mục tiêu dinh dưỡng (tăng cơ, giảm cân, thanh đạm) để nhận ngay thực đơn cá nhân hóa chính xác nhất!
              </p>
            </div>
            <Button
              onClick={() => navigate("/profile")}
              variant="outline"
              className="bg-white text-violet-700 hover:bg-violet-50 border-none shrink-0"
            >
              Thiết lập gu ẩm thực ngay
            </Button>
          </div>
        </section>
      )}

      {/* 3. DÀNH RIÊNG CHO BẠN (AI RECOMMENDATIONS CAROUSEL) */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600 fill-violet-600" />
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Dành riêng cho bạn hôm nay
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Các món ăn được thuật toán Hybrid RecSys tính toán điểm phù hợp cao nhất dựa trên sở thích và dinh dưỡng.
            </p>
          </div>
          <Link
            to="/recommendations"
            className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_RECOMMENDATIONS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-violet-100 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-slate-100">
                <img src={item.image_url || ""} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute top-2.5 left-2.5">
                  <MatchScoreIndicator score={item.match_score} size="sm" />
                </div>
              </div>

              <div className="space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">{item.restaurant_name}</span>
                  <Link to={`/foods/${item.slug}`} className="font-bold text-sm text-slate-800 hover:text-primary transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  <p className="text-[11px] text-violet-700 bg-violet-50/70 p-2 rounded-lg mt-2 leading-relaxed border border-violet-100/60">
                    💡 {item.match_reason}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-base font-extrabold text-primary">{formatVND(item.price)}</span>
                    <span className="text-[11px] text-slate-400 block font-medium">🔥 {item.calories} kcal • 🥩 {item.protein}g đạm</span>
                  </div>
                  <Link to={`/foods/${item.slug}`}>
                    <Button size="sm">Xem chi tiết</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CATEGORIES GRID */}
      <section className="container mx-auto px-4 max-w-6xl">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Danh mục ẩm thực phổ biến</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOCK_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/foods?category=${c.slug}`)}
              className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{c.icon_url}</span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. TRENDING DISHES */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500 fill-red-500" />
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Món ăn thịnh hành</h2>
          </div>
          <Link to="/foods" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Khám phá thêm</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_FOODS.slice(0, 4).map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      </section>

      {/* 6. FEATURED RESTAURANTS */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Nhà hàng đối tác nổi bật</h2>
          <Link to="/restaurants" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span>Xem tất cả quán</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_RESTAURANTS.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </section>
    </div>
  );
};
