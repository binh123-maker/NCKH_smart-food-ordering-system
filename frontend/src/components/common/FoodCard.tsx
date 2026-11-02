import React from "react";
import { Link } from "react-router-dom";
import { Plus, Heart } from "lucide-react";
import { Food } from "../../types";
import { formatVND } from "../../lib/utils";
import { MacroBadge } from "../ui/MacroBadge";
import { StarRating } from "../ui/StarRating";
import { useCartStore } from "../../stores/cartStore";

interface FoodCardProps {
  food: Food;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food }) => {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(food, 1);
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Food Image */}
      <Link to={`/foods/${food.slug}`} className="relative aspect-[4/3] overflow-hidden bg-slate-100 block">
        <img
          src={food.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"}
          alt={food.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {food.original_price && food.original_price > food.price && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            GIẢM {Math.round(((food.original_price - food.price) / food.original_price) * 100)}%
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 truncate">
              {food.restaurant?.name || "Nhà hàng đối tác"}
            </span>
            <StarRating rating={food.rating_average} size="sm" />
          </div>

          <Link to={`/foods/${food.slug}`}>
            <h3 className="font-bold text-slate-800 text-sm hover:text-primary transition-colors line-clamp-1 mb-2">
              {food.name}
            </h3>
          </Link>

          {/* Macro Nutrition Pills */}
          {food.nutrition && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <MacroBadge type="calories" value={food.nutrition.calories} />
              <MacroBadge type="protein" value={food.nutrition.protein} />
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-auto">
          <div>
            <span className="text-base font-extrabold text-primary">
              {formatVND(food.price)}
            </span>
            {food.original_price && (
              <span className="text-xs text-slate-400 line-through ml-2">
                {formatVND(food.original_price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            title="Thêm vào giỏ"
            className="h-9 w-9 rounded-xl bg-orange-50 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

