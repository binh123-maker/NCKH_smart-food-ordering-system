import React from "react";
import { cn } from "../../lib/utils";

interface MacroBadgeProps {
  type: "calories" | "protein" | "fat" | "carbs";
  value: number;
  className?: string;
}

export const MacroBadge: React.FC<MacroBadgeProps> = ({ type, value, className }) => {
  const config = {
    calories: { label: `${value} kcal`, icon: "🔥", bg: "bg-orange-50 text-orange-700 border-orange-100" },
    protein: { label: `${value}g Protein`, icon: "🥩", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    fat: { label: `${value}g Fat`, icon: "🥑", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    carbs: { label: `${value}g Carbs`, icon: "🌾", bg: "bg-sky-50 text-sky-700 border-sky-100" },
  };

  const { label, icon, bg } = config[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border",
        bg,
        className
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
};

