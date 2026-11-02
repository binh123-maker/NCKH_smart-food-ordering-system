import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Clock, CheckCircle2, XCircle, Star, ArrowRight, Truck } from "lucide-react";
import { MOCK_ORDERS } from "../data/mockData";
import { Order, OrderStatus } from "../types";
import { formatVND, formatDate } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { StarRating } from "../components/ui/StarRating";
import { EmptyState } from "../components/ui/EmptyState";

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isReviewed, setIsReviewed] = useState(false);

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

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" as OrderStatus } : o))
      );
    }
  };

  const handleSubmitReview = () => {
    setIsReviewed(true);
    setTimeout(() => {
      setReviewOrder(null);
      setIsReviewed(false);
      setComment("");
      alert("Cảm ơn bạn đã gửi đánh giá! Phản hồi của bạn đã được ghi nhận để hoàn thiện gợi ý món ăn.");
    }, 600);
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
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Lịch sử đơn hàng</h1>
        <p className="text-xs text-slate-500 mt-1">Theo dõi tiến trình và quản lý các đơn đặt món của bạn.</p>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "ALL", label: "Tất cả đơn" },
          { id: "ACTIVE", label: "Đang xử lý / Giao" },
          { id: "COMPLETED", label: "Đã hoàn thành" },
          { id: "CANCELLED", label: "Đã hủy" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="Không có đơn hàng nào"
          description="Bạn chưa có đơn hàng nào trong mục này."
          actionText="Khám phá thực đơn ngay"
          onAction={() => window.location.assign("/foods")}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800">{order.order_code}</span>
                    {renderStatusBadge(order.status)}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Đặt lúc: {formatDate(order.created_at)} • Quán: <strong className="text-slate-700">{order.restaurant_name}</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-primary">{formatVND(order.total_amount)}</span>
                  <span className="text-[10px] text-slate-400 block font-medium">({order.payment_method} - {order.payment_status})</span>
                </div>
              </div>

              {/* FSM PROGRESS TIMELINE TRACKER */}
              <div className="py-2">
                <div className="grid grid-cols-5 text-center relative gap-1 text-[11px] font-semibold">
                  {[
                    { label: "1. Đã đặt", active: true },
                    { label: "2. Xác nhận", active: ["CONFIRMED", "PREPARING", "DELIVERING", "COMPLETED"].includes(order.status) },
                    { label: "3. Nấu xong", active: ["PREPARING", "DELIVERING", "COMPLETED"].includes(order.status) },
                    { label: "4. Đang giao", active: ["DELIVERING", "COMPLETED"].includes(order.status) },
                    { label: "5. Hoàn thành", active: order.status === "COMPLETED" },
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                          step.active
                            ? "bg-primary text-white shadow-xs"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className={step.active ? "text-slate-800 font-bold" : "text-slate-400"}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-50 bg-slate-50/50 p-3 rounded-xl space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">
                      <strong className="text-primary">{item.quantity}x</strong> {item.food_name}
                    </span>
                    <span className="font-semibold text-slate-800">{formatVND(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {order.status === "PENDING" && (
                  <Button
                    onClick={() => handleCancelOrder(order.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Hủy đơn hàng
                  </Button>
                )}

                {order.status === "COMPLETED" && (
                  <Button
                    onClick={() => setReviewOrder(order)}
                    variant="outline"
                    size="sm"
                    className="border-amber-400 text-amber-700 hover:bg-amber-50"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>Đánh giá món ăn</span>
                  </Button>
                )}

                <Link to="/foods">
                  <Button variant="default" size="sm">
                    Đặt lại đơn này
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REVIEW MODAL */}
      <Modal
        isOpen={!!reviewOrder}
        onClose={() => setReviewOrder(null)}
        title="Đánh giá chất lượng món ăn"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Đánh giá của bạn giúp hệ thống AI thấu hiểu khẩu vị của bạn sâu sắc hơn để tinh chỉnh các món ăn đề xuất trong tương lai.
          </p>

          <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl gap-2">
            <span className="text-xs font-bold text-slate-700">Mức độ hài lòng:</span>
            <StarRating
              rating={rating}
              size="lg"
              interactive={true}
              onRatingChange={(newRating) => setRating(newRating)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Nhận xét chi tiết:</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Món ăn vừa miệng không? Hương vị thế nào? Độ đậm đà ra sao?..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setReviewOrder(null)}>
              Hủy
            </Button>
            <Button variant="default" className="flex-1" onClick={handleSubmitReview} isLoading={isReviewed}>
              Gửi đánh giá
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

