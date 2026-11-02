import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Tag } from "lucide-react";
import { MOCK_FOODS } from "../data/mockData";
import { FoodCard } from "../components/common/FoodCard";
import { EmptyState } from "../components/ui/EmptyState";

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchInput });
  };

  const results = query.trim()
    ? MOCK_FOODS.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.description?.toLowerCase().includes(query.toLowerCase()) ||
        f.ingredients?.some((ing) => ing.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const trendingKeywords = ["Cơm gà", "Salad", "Phở bò", "High Protein", "Eat Clean", "Bún nấm"];

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-black text-slate-800">Tìm kiếm món ăn thông minh</h1>
        <form onSubmit={handleSearch} className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-md border border-slate-200">
          <Search className="h-5 w-5 text-slate-400 ml-2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nhập tên món ăn, nhà hàng hoặc nguyên liệu..."
            className="flex-1 h-10 px-2 text-sm text-slate-800 outline-none"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-orange-600 transition-colors"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 flex-wrap">
          <Tag className="h-3.5 w-3.5 text-primary" />
          <span>Từ khóa nổi bật:</span>
          {trendingKeywords.map((kw) => (
            <button
              key={kw}
              onClick={() => {
                setSearchInput(kw);
                setSearchParams({ q: kw });
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-primary transition-colors text-[11px]"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div>
        {query ? (
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-6">
              Kết quả cho từ khóa: <strong className="text-primary">"{query}"</strong> ({results.length} món)
            </h2>

            {results.length === 0 ? (
              <EmptyState
                title="Không tìm thấy món ăn phù hợp"
                description={`Không có món ăn nào chứa từ khóa "${query}". Bạn có thể thử tìm theo danh mục hoặc nguyên liệu khác.`}
                actionText="Xóa từ khóa"
                onAction={() => {
                  setSearchInput("");
                  setSearchParams({});
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.map((food) => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            Vui lòng nhập từ khóa để tìm kiếm thực đơn phù hợp.
          </div>
        )}
      </div>
    </div>
  );
};

