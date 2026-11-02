import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Sparkles, User as UserIcon, LogOut, Shield, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import { Button } from "../ui/Button";

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getTotalItems, openDrawer } = useCartStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const totalCartItems = getTotalItems();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="container mx-auto px-4 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">
              Food<span className="text-primary">RecSys</span>
            </span>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              AI Food Ordering
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm món ngon, tên nhà hàng, dinh dưỡng..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-100/80 border-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </form>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link to="/" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <Link to="/foods" className="hover:text-primary transition-colors">
            Thực đơn
          </Link>
          <Link to="/restaurants" className="hover:text-primary transition-colors">
            Nhà hàng
          </Link>
          <Link
            to="/recommendations"
            className="flex items-center gap-1.5 text-violet-600 font-bold bg-violet-50 px-3 py-1.5 rounded-full hover:bg-violet-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gợi ý cho bạn</span>
          </Link>
          {isAuthenticated && (
            <Link to="/orders" className="hover:text-primary transition-colors">
              Đơn hàng
            </Link>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cart Button */}
          <button
            onClick={openDrawer}
            className="relative h-10 px-3.5 rounded-xl border border-slate-200 hover:border-primary hover:bg-orange-50/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">Giỏ</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 bg-primary text-white text-[11px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* User Auth Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <img
                  src={user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                  alt={user.full_name || "User"}
                  className="h-8 w-8 rounded-full object-cover border border-slate-200"
                />
                <span className="text-xs font-bold text-slate-700 hidden md:inline max-w-24 truncate">
                  {user.full_name || "Khách hàng"}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  onMouseLeave={() => setIsDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{user.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-orange-50 hover:text-primary transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Hồ sơ & Dinh dưỡng</span>
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-orange-50 hover:text-primary transition-colors"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Lịch sử đơn hàng</span>
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-purple-700 font-bold bg-purple-50/50 hover:bg-purple-100 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Trang Quản trị Admin</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/login")} variant="outline" size="sm">
                Đăng nhập
              </Button>
              <Button onClick={() => navigate("/register")} size="sm">
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

