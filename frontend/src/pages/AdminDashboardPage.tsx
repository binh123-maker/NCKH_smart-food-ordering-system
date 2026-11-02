import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Users,
  DollarSign,
  Brain,
  ArrowUpRight,
  Sparkles,
  Utensils,
} from "lucide-react";
import { formatVND } from "../lib/utils";
import { Order, Food } from "../types";
import { adminService } from "../services/adminService";
import { foodService } from "../services/foodService";
import { MOCK_FOODS, MOCK_ORDERS } from "../data/mockData";

export const AdminDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<any>({
    total_revenue: 14850000,
    total_orders: 142,
    total_customers: 1280,
    total_interactions_logged: 3450,
  });

  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [foods, setFoods] = useState<Food[]>(MOCK_FOODS);

  useEffect(() => {
    adminService.getDashboardKpis().then((data) => {
      if (data) setKpis(data);
    }).catch(() => {});

    adminService.getAllOrders(undefined, 1, 5).then((res) => {
      if (res && res.items && res.items.length > 0) setOrders(res.items);
    }).catch(() => {});

    foodService.getFoods({ limit: 5, sort_by: "popular" }).then((res) => {
      if (res && res.items && res.items.length > 0) setFoods(res.items);
    }).catch(() => {});
  }, []);

  const stats = [
    {
      title: "Tổng doanh thu hoàn tất",
      value: formatVND(kpis.total_revenue || 0),
      change: "+18.2%",
      isPositive: true,
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      title: "Tổng đơn hàng",
      value: `${kpis.total_orders || 0} đơn`,
      change: "+7.4%",
      isPositive: true,
      icon: ShoppingBag,
      color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      title: "Khách hàng đăng ký",
      value: `${kpis.total_customers || 0}`,
      change: "+12.1%",
      isPositive: true,
      icon: Users,
      color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      title: "Tương tác RecSys Logs",
      value: `${kpis.total_interactions_logged || 0}`,
      change: "+28.4%",
      isPositive: true,
      icon: Brain,
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500">{stat.title}</span>
                <p className="text-xl font-black text-slate-900">{stat.value}</p>
                <div className="flex items-center gap-1 text-[11px] font-semibold">
                  <span className="text-emerald-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 inline" /> {stat.change}
                  </span>
                  <span className="text-slate-400 font-normal">so với tháng trước</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* RecSys Model Health Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-300" /> Model Active: v1.0.4-hybrid
            </span>
            <span className="text-xs text-purple-300">Online Inference Engine</span>
          </div>
          <h3 className="text-lg font-black text-white">
            Hybrid Recommendation (Content-Based 40% + SVD Collaborative 60%)
          </h3>
          <p className="text-xs text-purple-200 max-w-xl">
            NDCG@10: <strong className="text-white">0.842</strong> | Precision@10:{" "}
            <strong className="text-white">0.725</strong> | Recall@10:{" "}
            <strong className="text-white">0.681</strong> | Catalog Coverage:{" "}
            <strong className="text-white">94.2%</strong>
          </p>
        </div>
        <Link
          to="/admin/recsys"
          className="px-4 py-2.5 rounded-xl bg-white text-purple-950 font-bold text-xs hover:bg-purple-50 transition-colors shadow-sm shrink-0"
        >
          Chi tiết Thực nghiệm RecSys →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Đơn hàng mới nhất</h3>
              <p className="text-xs text-slate-500">Giám sát xử lý đơn theo thời gian thực</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-primary hover:underline">
              Xem toàn bộ ({orders.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Nhà hàng</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{order.order_code}</td>
                    <td className="py-3 px-4 text-slate-600">{order.restaurant_name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatVND(order.total_amount)}
                    </td>
                    <td className="py-3 px-4">
                      {order.status === "COMPLETED" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          Hoàn thành
                        </span>
                      ) : order.status === "PREPARING" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          Đang chuẩn bị
                        </span>
                      ) : order.status === "DELIVERING" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                          Đang giao
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                          Chờ xác nhận
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{order.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Recommended Foods */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Món được gợi ý nhiều nhất</h3>
              <p className="text-xs text-slate-500">Hiệu quả phân bổ Recommendation</p>
            </div>
            <Utensils className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {foods.slice(0, 5).map((food: Food, i: number) => (
              <div
                key={food.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <span className="h-6 w-6 rounded-lg bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center shrink-0">
                  #{i + 1}
                </span>
                <img
                  src={
                    food.image_url ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={food.name}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{food.name}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">{formatVND(food.price)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-extrabold text-primary">
                    ★ {food.rating_average}
                  </span>
                  <p className="text-[10px] text-slate-400">{food.order_count} lượt mua</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/admin/foods"
            className="block text-center w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Quản lý toàn bộ món ăn →
          </Link>
        </div>
      </div>
    </div>
  );
};
