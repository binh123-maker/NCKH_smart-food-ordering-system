import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, text }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className={cn("h-8 w-8 animate-spin text-primary", className)} />
      {text && <p className="text-xs text-slate-500 font-medium">{text}</p>}
    </div>
  );
};

