import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Clock, CheckCircle2, XCircle, Star, ArrowRight, Truck } from "lucide-react";
import { Order, OrderStatus } from "../types";
import { formatVND, formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { orderService } from "../services/orderService";
import { reviewService } from "../services/reviewService";
import { useAuthStore } from "../stores/authStore";
import { MOCK_ORDERS } from "../data/mockData";

export const OrderHistoryPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchOrders = () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setOrders(MOCK_ORDERS);
      return;
    }
    setIsLoading(true);
    orderService
      .getOrders()
      .then((res) => {
        if (res && res.items) {
          setOrders(res.items);
        }
      })
      .catch(() => {
        setOrders(MOCK_ORDERS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const filterMap: Record<string, OrderStatus[]> = {
    ACTIVE: ["PENDING", "CONFIRMED", "PREPARING", "DELIVERING"],
    COMPLETED: ["COMPLETED"],
    CANCELLED: ["CANCELLED"],
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    const allowed = filterMap[activeTab] || [];
    return allowed.includes(o.status);
  });

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
      try {
        await orderService.cancelOrder(orderId, "Khách hàng yêu cầu hủy đơn");
        fetchOrders();
      } catch (err: any) {
        alert(err.response?.data?.message || "Không thể hủy đơn hàng này.");
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    const firstItem = reviewOrder.items?.[0];
    if (!firstItem) return;

    setIsSubmittingReview(true);
    try {
      await reviewService.createReview({
        order_id: reviewOrder.id,
        food_id: firstItem.food_id,
        rating,
        comment,
      });
      alert("Cảm ơn bạn đã gửi đánh giá! Phản hồi của bạn đã được ghi nhận để cải thiện thuật toán gợi ý món ăn.");
      setReviewOrder(null);
      setComment("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại sau.");
    } finally {
      setReviewOrder(null);
      setIsSubmittingReview(false);
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    const config: Record<OrderStatus, { label: string; bg: string; text: string }> = {
      PENDING: { label: "Chờ xác nhận", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
      CONFIRMED: { label: "Đã xác nhận", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
      PREPARING: { label: "Đang chế biến", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
      DELIVERING: { label: "Đang giao hàng", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
      COMPLETED: { label: "Giao thành công", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
      CANCELLED: { label: "Đã hủy", bg: "bg-red-50 border-red-200", text: "text-red-700" },
    };
    const c = config[status] || { label: status, bg: "bg-slate-50", text: "text-slate-700" };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {c.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Lịch sử Đơn hàng</h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi trạng thái giao hàng, kiểm tra chi tiết và gửi đánh giá món ăn đã đặt.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {[
          { id: "ALL", label: "Tất cả đơn" },
          { id: "ACTIVE", label: "Đang xử lý" },
          { id: "COMPLETED", label: "Đã hoàn thành" },
          { id: "CANCELLED", label: "Đã hủy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Đang tải lịch sử đơn hàng..." />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="Chưa có đơn hàng nào"
          description="Bạn chưa có đơn đặt hàng nào trong danh mục này. Hãy khám phá món ăn ngon và đặt ngay nhé!"
          actionLabel="Khám phá thực đơn"
          onAction={() => (window.location.href = "/foods")}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      Mã đơn: #{order.order_code}
                    </span>
                    {renderStatusBadge(order.status)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Thời gian đặt: {formatDate(order.created_at)} • Nhà hàng:{" "}
                    <strong className="text-slate-700">{order.restaurant_name}</strong>
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-base font-black text-primary block">
                    {formatVND(order.total_amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {order.payment_method} ({order.payment_status || "PENDING"})
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {order.items?.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-700 font-medium">
                      {it.food_name} <strong className="text-primary">x{it.quantity}</strong>
                    </span>
                    <span className="font-bold text-slate-800">{formatVND(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              {order.delivery_address && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  📍 Địa chỉ nhận hàng: <span className="font-medium text-slate-700">{order.delivery_address}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {order.status === "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReviewOrder(order)}
                    >
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span>Đánh giá món ăn</span>
                    </Button>
                  )}

                  <Link to="/foods">
                    <Button size="sm">
                      <span>Đặt lại món này</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={Boolean(reviewOrder)}
        onClose={() => setReviewOrder(null)}
        title={`Đánh giá món ăn (#${reviewOrder?.order_code})`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Số sao đánh giá chất lượng:</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Cảm nhận và nhận xét:</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ hương vị, độ tươi ngon, khẩu phần..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setReviewOrder(null)}>
              Hủy
            </Button>
            <Button isLoading={isSubmittingReview} onClick={handleSubmitReview}>
              Gửi đánh giá
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
