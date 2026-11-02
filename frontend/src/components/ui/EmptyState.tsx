import React from "react";
import { UtensilsCrossed } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Không tìm thấy dữ liệu",
  description = "Hiện tại chưa có dữ liệu nào phù hợp với yêu cầu của bạn.",
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
      <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center text-primary mb-4">
        {icon || <UtensilsCrossed className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
};

