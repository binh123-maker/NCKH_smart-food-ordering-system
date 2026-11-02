import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Đã xảy ra sự cố",
  message = "Không thể tải dữ liệu vào lúc này. Vui lòng thử lại sau.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center max-w-sm mx-auto">
      <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-5">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Thử lại ngay
        </Button>
      )}
    </div>
  );
};

