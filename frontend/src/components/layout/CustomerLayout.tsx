import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { CartConflictModal } from "../common/CartConflictModal";

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold py-1.5 px-4 text-center">
        🎉 Đặt món thông minh: Tiết kiệm thời gian với hệ thống gợi ý chuẩn gu ẩm thực & dinh dưỡng!
      </div>

      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />
      <CartConflictModal />
    </div>
  );
};

