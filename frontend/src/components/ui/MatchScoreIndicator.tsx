import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface MatchScoreIndicatorProps {
  score: number; // 0.0 to 1.0 or 0 to 100
  size?: "sm" | "md";
  className?: string;
}

export const MatchScoreIndicator: React.FC<MatchScoreIndicatorProps> = ({
  score,
  size = "md",
  className,
}) => {
  const percentage = Math.round(score <= 1.0 ? score * 100 : score);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 font-bold rounded-full border shadow-sm",
        "bg-gradient-to-r from-violet-50 to-orange-50 border-violet-200/60 text-violet-700",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Sparkles className={cn("text-amber-500 fill-amber-500", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{percentage}% Phù hợp</span>
    </div>
  );
};

