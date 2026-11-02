import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Utensils, Store, ShoppingBag, Brain, LogOut, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { cn } from "../../lib/utils";

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Quản lý Món ăn", path: "/admin/foods", icon: Utensils },
    { label: "Quản lý Nhà hàng", path: "/admin/restaurants", icon: Store },
    { label: "Quản lý Đơn hàng", path: "/admin/orders", icon: ShoppingBag },
    { label: "Mô hình RecSys AI", path: "/admin/recsys", icon: Brain },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <h2 className="text-white font-extrabold text-sm tracking-tight">Admin Portal</h2>
            <p className="text-[10px] text-slate-400">Hệ thống Đặt đồ ăn & RecSys</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang khách hàng</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <h1 className="font-bold text-slate-800 text-sm">
            {navItems.find((i) => i.path === location.pathname)?.label || "Bảng điều khiển"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Đăng nhập với vai trò: <strong className="text-slate-800">{user?.role || "ADMIN"}</strong>
            </span>
            <div className="h-8 w-8 rounded-full bg-orange-100 text-primary font-bold text-xs flex items-center justify-center">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

