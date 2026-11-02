import React from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import { Restaurant } from "../../types";
import { StarRating } from "../ui/StarRating";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  return (
    <Link
      to={`/restaurants/${restaurant.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <img
          src={restaurant.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {restaurant.distance_km && (
          <span className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {restaurant.distance_km} km
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors line-clamp-1">
              {restaurant.name}
            </h3>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 mb-3">{restaurant.address}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
          <StarRating rating={restaurant.rating_average} totalReviews={restaurant.total_reviews} size="sm" />
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{restaurant.opening_hours}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

