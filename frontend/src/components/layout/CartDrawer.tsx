import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { formatVND } from "../../lib/utils";
import { Button } from "../ui/Button";

export const CartDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, items, restaurantName, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const subtotal = getSubtotal();

  const handleCheckout = () => {
    closeDrawer();
    navigate("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-slate-800 text-base">Giỏ hàng của bạn</h3>
            <span className="bg-orange-50 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length} món
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Restaurant banner */}
        {restaurantName && (
          <div className="bg-orange-50/60 px-4 py-2 border-b border-orange-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Đơn từ: <strong className="text-slate-800">{restaurantName}</strong></span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600 mb-1">Giỏ hàng đang trống</p>
              <p className="text-xs text-slate-400 mb-4">Hãy chọn những món ăn ngon miệng và giàu dinh dưỡng nhé!</p>
              <Button onClick={closeDrawer} size="sm">
                Khám phá món ăn ngay
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
              >
                <img
                  src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80"}
                  alt={item.food_name}
                  className="h-16 w-16 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-xs truncate mb-1">
                    {item.food_name}
                  </h4>
                  <div className="text-xs font-bold text-primary mb-2">
                    {formatVND(item.unit_price)}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center border border-slate-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-slate-500 hover:text-primary transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-700 min-w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-slate-500 hover:text-primary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors ml-auto"
                      title="Xóa món"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Tạm tính:</span>
              <span className="font-bold text-slate-800 text-base">{formatVND(subtotal)}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Phí giao hàng và mã giảm giá sẽ được áp dụng tại bước thanh toán.
            </p>
            <Button onClick={handleCheckout} className="w-full" size="lg">
              <span>Tiến hành Đặt hàng</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

