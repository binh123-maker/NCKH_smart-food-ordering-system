import React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useCartStore } from "../../stores/cartStore";
import { AlertTriangle } from "lucide-react";

export const CartConflictModal: React.FC = () => {
  const { conflictItem, clearConflict, addItem } = useCartStore();

  if (!conflictItem) return null;

  const handleConfirm = () => {
    addItem(conflictItem.food, conflictItem.quantity, conflictItem.notes, true);
  };

  return (
    <Modal isOpen={!!conflictItem} onClose={clearConflict} title="Đổi nhà hàng đặt món">
      <div className="flex flex-col items-center text-center p-2">
        <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Giỏ hàng của bạn đang chứa món ăn từ nhà hàng khác. Hệ thống hiện chỉ hỗ trợ giao hàng từ 
          <strong className="text-slate-800"> một nhà hàng trong một đơn</strong>.
          <br /><br />
          Bạn có muốn làm mới giỏ hàng để chọn món từ 
          <span className="text-primary font-bold"> {conflictItem.food.restaurant?.name || "quán mới"}</span>?
        </p>

        <div className="flex items-center gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={clearConflict}>
            Hủy bỏ
          </Button>
          <Button variant="default" className="flex-1" onClick={handleConfirm}>
            Làm mới giỏ & Thêm món
          </Button>
        </div>
      </div>
    </Modal>
  );
};

