import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, CreditCard, Banknote, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCartStore } from "../stores/cartStore";
import { useAuthStore } from "../stores/authStore";
import { formatVND } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { userService } from "../services/userService";
import { cartService } from "../services/cartService";
import { orderService } from "../services/orderService";
import { UserAddress } from "../types";

export const CheckoutPage: React.FC = () => {
  const { items, restaurantName, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MOMO" | "VNPAY">("COD");
  const [recipientName, setRecipientName] = useState(user?.full_name || "Nguyễn Văn A");
  const [phone, setPhone] = useState(user?.phone || "0901234567");
  const [addressLine, setAddressLine] = useState("123 Nguyễn Huệ, Phường Bến Nghé");
  const [district, setDistrict] = useState("Quận 1");
  const [city, setCity] = useState("TP. Hồ Chí Minh");
  const [deliveryNotes, setDeliveryNotes] = useState("Giao giờ hành chính, gọi trước khi đến");
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherSuccess, setVoucherSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      userService.getAddresses().then((addrs) => {
        if (addrs && addrs.length > 0) {
          setAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddressId(defaultAddr.id);
          setRecipientName(defaultAddr.recipient_name);
          setPhone(defaultAddr.recipient_phone);
          setAddressLine(defaultAddr.address_line);
          setDistrict(defaultAddr.district || "Quận 1");
          setCity(defaultAddr.city);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

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

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Ensure address exists
      let targetAddressId = selectedAddressId;
      if (!targetAddressId) {
        const createdAddr = await userService.addAddress({
          recipient_name: recipientName,
          recipient_phone: phone,
          address_line: addressLine,
          district: district,
          city: city,
          is_default: true,
        });
        targetAddressId = createdAddr.id;
      }

      // 2. Sync items to backend cart
      try {
        await cartService.clearCart();
        for (const it of items) {
          await cartService.addItem({
            food_id: it.food_id,
            quantity: it.quantity,
            notes: it.notes || undefined,
          });
        }
      } catch (cartErr) {
        console.warn("Cart sync notice:", cartErr);
      }

      // 3. Create Order
      await orderService.createOrder({
        address_id: targetAddressId,
        payment_method: paymentMethod,
        delivery_notes: deliveryNotes,
      });

      clearCart();
      setIsSubmitting(false);
      navigate("/orders");
    } catch (err: any) {
      setIsSubmitting(false);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.details ||
        "Đặt hàng không thành công. Vui lòng kiểm tra lại.";
      setErrorMsg(msg);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-xl py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-slate-500">
          Hãy dạo một vòng thực đơn và chọn món ăn ngon trước khi tiến hành thanh toán nhé!
        </p>
        <Link to="/foods">
          <Button size="md">Khám phá món ăn ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Thanh toán & Đặt hàng</h1>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng kiểm tra kỹ địa chỉ nhận hàng và thông tin thanh toán trước khi xác nhận.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Address Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-slate-800 text-sm">Địa chỉ giao hàng</h2>
            </div>

            {addresses.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">Chọn địa chỉ đã lưu:</span>
                <div className="grid grid-cols-1 gap-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        selectedAddressId === a.id
                          ? "bg-orange-50 border-primary text-slate-900"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <p className="font-bold">
                          {a.recipient_name} ({a.recipient_phone})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {a.address_line}, {a.district}, {a.city}
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="saved_address"
                        checked={selectedAddressId === a.id}
                        onChange={() => {
                          setSelectedAddressId(a.id);
                          setRecipientName(a.recipient_name);
                          setPhone(a.recipient_phone);
                          setAddressLine(a.address_line);
                          setDistrict(a.district || "");
                          setCity(a.city);
                        }}
                        className="text-primary"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold text-slate-500 block">Hoặc nhập địa chỉ mới:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Họ tên người nhận"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary"
                />
              </div>

              <input
                type="text"
                placeholder="Địa chỉ số nhà, tên đường..."
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Quận / Huyện"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Tỉnh / Thành phố"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary"
                />
              </div>

              <textarea
                rows={2}
                placeholder="Ghi chú giao hàng (VD: sảnh lễ tân, gọi trước khi đến...)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-slate-800 text-sm">Phương thức thanh toán</h2>
            </div>

            <div className="space-y-2">
              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "bg-orange-50/60 border-primary text-slate-900 font-semibold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="font-bold">Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-[11px] text-slate-400">Trả tiền mặt trực tiếp cho tài xế giao hàng</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="text-primary"
                />
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  paymentMethod === "MOMO"
                    ? "bg-orange-50/60 border-primary text-slate-900 font-semibold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-pink-600">MoMo</span>
                  <div>
                    <p className="font-bold">Ví Điện Tử MoMo</p>
                    <p className="text-[11px] text-slate-400">Quét mã QR thanh toán nhanh chóng</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "MOMO"}
                  onChange={() => setPaymentMethod("MOMO")}
                  className="text-primary"
                />
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                  paymentMethod === "VNPAY"
                    ? "bg-orange-50/60 border-primary text-slate-900 font-semibold"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-blue-600">VNPAY</span>
                  <div>
                    <p className="font-bold">Cổng VNPAY / Thẻ Ngân Hàng</p>
                    <p className="text-[11px] text-slate-400">Thẻ ATM nội địa, QR Code ngân hàng</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "VNPAY"}
                  onChange={() => setPaymentMethod("VNPAY")}
                  className="text-primary"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Summary */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 sticky top-22">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">Tóm tắt đơn hàng</h2>
            <p className="text-[11px] text-slate-400">
              Nhà hàng: <strong className="text-slate-700">{restaurantName || "Đang chọn"}</strong>
            </p>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">
                    {it.food_name} <span className="text-primary">x{it.quantity}</span>
                  </p>
                  {it.notes && <p className="text-[10px] text-slate-400 italic">"{it.notes}"</p>}
                </div>
                <span className="font-black text-slate-900">{formatVND(it.unit_price * it.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Voucher Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Mã voucher (FREESHIP, GIAM20K)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none uppercase"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Áp dụng
              </button>
            </div>
            {voucherSuccess && (
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Đã áp dụng mã giảm giá thành công!
              </p>
            )}
          </div>

          {/* Pricing Details */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Tạm tính tiền món:</span>
              <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Phí giao hàng:</span>
              <span className="font-semibold text-slate-800">{formatVND(deliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Giảm giá:</span>
                <span>-{formatVND(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-black text-base pt-3 border-t border-slate-200">
              <span>Tổng cộng thanh toán:</span>
              <span className="text-primary">{formatVND(total)}</span>
            </div>
          </div>

          <Button
            onClick={handlePlaceOrder}
            isLoading={isSubmitting}
            size="lg"
            className="w-full shadow-lg"
          >
            <span>Xác nhận Đặt hàng • {formatVND(total)}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Bằng việc nhấn đặt hàng, bạn đồng ý với Điều khoản dịch vụ và Chính sách giao nhận của hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};
