import React, { useState } from "react";
import { Search, Filter, Eye, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import { MOCK_ORDERS } from "../data/mockData";
import { Order, OrderStatus, OrderItem } from "../types";
import { formatVND } from "../lib/utils";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";

export const AdminOrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = selectedStatus === "all" || order.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Đã giao</span>;
      case "DELIVERING":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 flex items-center gap-1 w-fit"><Truck className="h-3 w-3" /> Đang giao hàng</span>;
      case "PREPARING":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Đang chế biến</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> Chờ xác nhận</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" /> Đã hủy</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Quản lý Đơn hàng</h2>
          <p className="text-xs text-slate-500">Giám sát và chuyển đổi trạng thái đơn đặt hàng theo thời gian thực</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            Tổng cộng: {orders.length} đơn hàng
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo mã đơn hoặc tên nhà hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 text-xs rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-700 outline-none focus:border-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="PREPARING">Đang chế biến</option>
            <option value="DELIVERING">Đang giao hàng</option>
            <option value="COMPLETED">Đã giao thành công</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Nhà hàng</th>
                <th className="py-3 px-4">Món ăn / Số lượng</th>
                <th className="py-3 px-4">Tổng tiền</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Hành động cập nhật</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-black text-slate-900">{order.order_code}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{order.restaurant_name}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-700">
                      {order.items.map((i: OrderItem) => `${i.food_name} (x${i.quantity})`).join(", ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">{formatVND(order.total_amount)}</td>
                  <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="text-[11px] font-bold rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 text-slate-700 focus:border-primary outline-none"
                    >
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="PREPARING">Đang chế biến</option>
                      <option value="DELIVERING">Đang giao</option>
                      <option value="COMPLETED">Đã giao</option>
                      <option value="CANCELLED">Hủy đơn</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setViewingOrder(order)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                      title="Xem chi tiết đơn"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
        title={`Chi tiết đơn hàng #${viewingOrder?.order_code}`}
      >
        {viewingOrder && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="text-slate-400">Nhà hàng: <strong className="text-slate-800">{viewingOrder.restaurant_name}</strong></p>
                <p className="text-slate-400">Thời gian tạo: <strong className="text-slate-800">{viewingOrder.created_at}</strong></p>
              </div>
              <div>{getStatusBadge(viewingOrder.status)}</div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Danh sách món đặt:</h4>
              <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                {viewingOrder.items.map((item: OrderItem, idx: number) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-50">
                    <span className="font-semibold text-slate-800">
                      {item.food_name} <span className="text-primary">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-slate-900">{formatVND(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Phương thức thanh toán:</span>
                <span className="font-bold text-slate-800">{viewingOrder.payment_method}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Địa chỉ nhận hàng:</span>
                <span className="font-bold text-slate-800">{viewingOrder.delivery_address}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-black text-sm pt-2 border-t border-slate-200">
                <span>Tổng cộng:</span>
                <span className="text-primary">{formatVND(viewingOrder.total_amount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewingOrder(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
