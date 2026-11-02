import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Banknote, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCartStore } from "../stores/cartStore";
import { formatVND } from "../lib/utils";
import { Button } from "../components/ui/Button";

export const CheckoutPage: React.FC = () => {
  const { items, restaurantName, getSubtotal, clearCart } = useCartStore();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "SANDBOX">("COD");
  const [recipientName, setRecipientName] = useState("Nguyễn Văn A");
  const [phone, setPhone] = useState("0901234567");
  const [address, setAddress] = useState("123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM");
  const [deliveryNotes, setDeliveryNotes] = useState("Giao giờ hành chính, gọi trước khi đến");
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherSuccess, setVoucherSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const deliveryFee = 15000;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const handleApplyVoucher = () => {
    if (voucherCode.trim().toUpperCase() === "FREESHIP") {
      setDiscount(15000);
      setVoucherSuccess(true);
    } else if (voucherCode.trim().toUpperCase() === "GIAM20K") {
      setDiscount(20000);
      setVoucherSuccess(true);
    } else {
      alert("Mã giảm giá không hợp lệ. Hãy thử 'FREESHIP' hoặc 'GIAM20K'!");
    }
  };

  const handlePlaceOrder = () => {
    if (!recipientName || !phone || !address) {
      alert("Vui lòng điền đầy đủ thông tin nhận hàng!");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      navigate("/orders");
    }, 1200);
  };

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Thanh toán & Đặt hàng</h1>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng kiểm tra kỹ địa chỉ nhận hàng và thông tin thanh toán trước khi xác nhận.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: INFORMATION & PAYMENT */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Address Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-slate-800 text-sm">Địa chỉ nhận hàng</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Người nhận:</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Số điện thoại:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Địa chỉ chi tiết:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Ghi chú giao hàng:</label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ghi chú cho tài xế giao hàng..."
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* 2. Payment Method */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-slate-800 text-sm">Phương thức thanh toán</h2>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "border-primary bg-orange-50/40 text-slate-800"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-xs block">Thanh toán tiền mặt khi nhận hàng (COD)</span>
                    <span className="text-[11px] text-slate-400">Trả tiền trực tiếp cho tài xế khi giao món</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="accent-primary"
                />
              </label>

              <label
                onClick={() => setPaymentMethod("SANDBOX")}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === "SANDBOX"
                    ? "border-primary bg-orange-50/40 text-slate-800"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-bold text-xs block">Ví điện tử / Thẻ thanh toán (Sandbox Demo)</span>
                    <span className="text-[11px] text-slate-400">Mô phỏng cổng thanh toán VNPAY / MoMo an toàn</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "SANDBOX"}
                  onChange={() => setPaymentMethod("SANDBOX")}
                  className="accent-primary"
                />
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Món ăn đã chọn</h3>
            <span className="text-xs text-slate-400 block">{restaurantName || "Nhà hàng"}</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
            {items.map((item) => (
              <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{item.quantity}x</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[180px]">{item.food_name}</span>
                </div>
                <span className="font-bold text-slate-800">{formatVND(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Voucher Input */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block">Mã giảm giá (Voucher):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="Nhập FREESHIP hoặc GIAM20K"
                className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-primary uppercase font-semibold"
              />
              <Button onClick={handleApplyVoucher} variant="outline" size="sm">
                Áp dụng
              </Button>
            </div>
            {voucherSuccess && (
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã áp dụng mã giảm giá thành công!
              </span>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-xs pt-4 border-t border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính tiền món:</span>
              <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold text-slate-800">{formatVND(deliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá:</span>
                <span className="font-bold">-{formatVND(discount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="font-bold text-slate-800 text-sm">Tổng thanh toán:</span>
              <span className="font-black text-xl text-primary">{formatVND(total)}</span>
            </div>
          </div>

          <Button onClick={handlePlaceOrder} isLoading={isSubmitting} className="w-full" size="lg">
            <span>Xác nhận & Đặt hàng ngay</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

