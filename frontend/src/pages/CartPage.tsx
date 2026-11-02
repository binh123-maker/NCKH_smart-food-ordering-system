import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useCartStore } from "../stores/cartStore";
import { formatVND } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

export const CartPage: React.FC = () => {
  const { items, restaurantName, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const deliveryFee = items.length > 0 ? 15000 : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <EmptyState
          title="Giỏ hàng của bạn đang trống"
          description="Bạn chưa chọn món ăn nào. Hãy dạo quanh thực đơn và chọn những món ăn ngon miệng nhé!"
          actionText="Xem thực đơn ngay"
          onAction={() => navigate("/foods")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Giỏ hàng của bạn</h1>
          {restaurantName && (
            <p className="text-xs text-slate-500 mt-1">
              Đơn hàng được phục vụ bởi: <strong className="text-primary">{restaurantName}</strong>
            </p>
          )}
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          <span>Làm trống giỏ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List (Left Col) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 font-semibold text-xs text-slate-500 grid grid-cols-12">
            <span className="col-span-6">Món ăn</span>
            <span className="col-span-2 text-center">Đơn giá</span>
            <span className="col-span-2 text-center">Số lượng</span>
            <span className="col-span-2 text-right">Thành tiền</span>
          </div>

          <div className="divide-y divide-slate-100 p-2">
            {items.map((item) => (
              <div key={item.id} className="p-3 grid grid-cols-12 items-center gap-2">
                <div className="col-span-6 flex items-center gap-3">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80"}
                    alt={item.food_name}
                    className="h-14 w-14 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate">{item.food_name}</h4>
                    {item.notes && <p className="text-[11px] text-slate-400 truncate">Ghi chú: {item.notes}</p>}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[11px] text-red-400 hover:text-red-600 mt-1 inline-block"
                    >
                      Xóa món
                    </button>
                  </div>
                </div>

                <div className="col-span-2 text-center text-xs font-semibold text-slate-700">
                  {formatVND(item.unit_price)}
                </div>

                <div className="col-span-2 flex justify-center">
                  <div className="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-slate-500 hover:text-primary"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-700 min-w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-slate-500 hover:text-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 text-right text-xs font-extrabold text-primary">
                  {formatVND(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/40">
            <Link to="/foods" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              <span>Tiếp tục chọn thêm món ăn khác</span>
            </Link>
          </div>
        </div>

        {/* Summary Card (Right Col) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
            Tóm tắt đơn hàng
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tiền món ăn:</span>
              <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold text-slate-800">{formatVND(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Giảm giá:</span>
              <span className="font-semibold text-emerald-600">- 0 đ</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="font-bold text-slate-800 text-sm">Tổng cộng:</span>
              <span className="font-black text-xl text-primary">{formatVND(total)}</span>
            </div>
          </div>

          <Button onClick={() => navigate("/checkout")} className="w-full" size="lg">
            <span>Tiến hành Thanh toán</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

