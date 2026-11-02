import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, text, size = "md" }) => {
  const sizeClass = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className={cn("animate-spin text-primary", sizeClass, className)} />
      {text && <p className="text-xs text-slate-500 font-medium">{text}</p>}
    </div>
  );
};

