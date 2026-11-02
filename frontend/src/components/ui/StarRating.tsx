import React from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalReviews,
  size = "md",
  interactive = false,
  onRatingChange,
  className,
}) => {
  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(rating);
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(star)}
              className={cn(
                "p-0.5 transition-transform",
                interactive && "hover:scale-125 cursor-pointer"
              )}
            >
              <Star
                className={cn(
                  iconSizes[size],
                  filled
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200 fill-slate-100"
                )}
              />
            </button>
          );
        })}
      </div>
      <span className={cn("font-semibold text-slate-700", size === "sm" ? "text-xs" : "text-sm")}>
        {rating.toFixed(1)}
      </span>
      {totalReviews !== undefined && (
        <span className={cn("text-slate-400", size === "sm" ? "text-[11px]" : "text-xs")}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

