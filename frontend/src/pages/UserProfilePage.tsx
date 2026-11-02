import React, { useState } from "react";
import { User, MapPin, Sparkles, Check, Plus, Trash2, Shield } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { MOCK_CATEGORIES } from "../data/mockData";

export const UserProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "preferences">("profile");

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || "Nguyễn Văn A");
  const [phone, setPhone] = useState(user?.phone || "0901234567");
  const [profileSaved, setProfileSaved] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState([
    { id: "addr-1", name: "Nhà riêng", recipient: "Nguyễn Văn A (0901234567)", detail: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM", isDefault: true },
    { id: "addr-2", name: "Công ty", recipient: "Nguyễn Văn A (0901234567)", detail: "Tầng 8, Tòa nhà Vincom Center, Quận 1, TP.HCM", isDefault: false },
  ]);

  // RecSys Preferences State
  const [preferredCats, setPreferredCats] = useState<string[]>(["cat-1", "cat-3"]);
  const [budget, setBudget] = useState(60000);
  const [dailyCalo, setDailyCalo] = useState(2000);
  const [proteinMin, setProteinMin] = useState(30);
  const [prefSaved, setPrefSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ full_name: fullName, phone });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSavePreferences = () => {
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Quản lý Tài khoản & Cá nhân hóa</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cập nhật thông tin nhận hàng và mục tiêu dinh dưỡng để hệ thống gợi ý món ăn chuẩn xác nhất.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "profile" ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "addresses" ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          Sổ địa chỉ ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "preferences" ? "bg-violet-600 text-white shadow-xs" : "text-violet-600 hover:bg-violet-50"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sở thích & Mục tiêu Dinh dưỡng (RecSys)</span>
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === "profile" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-xl space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={user?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover border-2 border-primary"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-800">{user?.full_name || "Khách hàng"}</h3>
                <span className="text-xs text-slate-400">{user?.email}</span>
                <span className="block text-[10px] text-emerald-600 font-bold uppercase mt-0.5">Tài khoản đang hoạt động</span>
              </div>
            </div>

            <Input
              label="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Địa chỉ Email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />

            <Input
              label="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="pt-2 flex items-center justify-between">
              <Button type="submit">Lưu thay đổi</Button>
              {profileSaved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="h-4 w-4" /> Đã cập nhật thành công!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ADDRESSES */}
      {activeTab === "addresses" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-slate-700">Địa chỉ giao hàng đã lưu</h3>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm địa chỉ mới</span>
            </Button>
          </div>

          <div className="space-y-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{a.name}</span>
                    {a.isDefault && (
                      <span className="bg-orange-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{a.recipient}</p>
                  <p className="text-xs text-slate-400">{a.detail}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!a.isDefault && (
                    <button
                      onClick={() =>
                        setAddresses((prev) =>
                          prev.map((item) => ({ ...item, isDefault: item.id === a.id }))
                        )
                      }
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Đặt mặc định
                    </button>
                  )}
                  <button className="p-1 text-slate-300 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RECSYS PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl space-y-6">
          <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 text-xs text-violet-800 leading-relaxed">
            ✨ Các tùy chọn này được nạp trực tiếp vào **Vector Đặc trưng Người dùng (User Feature Vector)** của mô hình Content-Based và Hybrid RecSys để tính điểm phù hợp (Match Score).
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Danh mục ẩm thực ưa thích:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOCK_CATEGORIES.map((c) => {
                const isSel = preferredCats.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setPreferredCats((prev) =>
                        prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                      )
                    }
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                      isSel
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{c.icon_url}</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Ngân sách kỳ vọng một bữa ăn:</label>
              <span className="text-xs font-extrabold text-primary">{budget.toLocaleString("vi-VN")} đ</span>
            </div>
            <input
              type="range"
              min="25000"
              max="150000"
              step="5000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Calorie Target */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Mục tiêu Calo hàng ngày (Daily Calories):</label>
              <span className="text-xs font-extrabold text-orange-600">{dailyCalo} kcal / ngày</span>
            </div>
            <input
              type="range"
              min="1200"
              max="3500"
              step="50"
              value={dailyCalo}
              onChange={(e) => setDailyCalo(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          {/* Min Protein */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Lượng Đạm (Protein) tối thiểu mong muốn mỗi bữa:</label>
              <span className="text-xs font-extrabold text-emerald-600">&ge; {proteinMin}g Protein</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={proteinMin}
              onChange={(e) => setProteinMin(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button onClick={handleSavePreferences} variant="ai">
              Cập nhật dữ liệu AI
            </Button>
            {prefSaved && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="h-4 w-4" /> Đã lưu thông số thành công!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

