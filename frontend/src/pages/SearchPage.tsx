import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Tag } from "lucide-react";
import { foodService } from "../services/foodService";
import { Food } from "../types";
import { FoodCard } from "../components/common/FoodCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { MOCK_FOODS } from "../data/mockData";

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    foodService
      .getFoods({ search: query.trim() })
      .then((res) => {
        if (res && res.items) {
          setResults(res.items);
        }
      })
      .catch(() => {
        // Fallback filter
        const fallback = MOCK_FOODS.filter((f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.description?.toLowerCase().includes(query.toLowerCase())
        );
        setResults(fallback);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchInput });
  };

  const trendingKeywords = ["Cơm gà", "Salad", "Phở bò", "High Protein", "Eat Clean"];

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-black text-slate-800">Tìm kiếm món ăn thông minh</h1>
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-md border border-slate-200"
        >
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
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-orange-600 transition-colors cursor-pointer"
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
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-primary transition-colors text-[11px] cursor-pointer"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {query && (
          <p className="text-xs text-slate-500 font-medium">
            Kết quả tìm kiếm cho từ khóa: <strong className="text-slate-800">"{query}"</strong>
          </p>
        )}

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" text="Đang tìm kiếm món ăn phù hợp..." />
          </div>
        ) : !query.trim() ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            Hãy nhập từ khóa để bắt đầu tìm kiếm món ăn.
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="Không tìm thấy món ăn"
            description={`Không có kết quả nào khớp với từ khóa "${query}". Vui lòng thử từ khóa khác.`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
