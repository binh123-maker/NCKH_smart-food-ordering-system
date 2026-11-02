import React, { useState, useEffect } from "react";
import { User as UserIcon, MapPin, Sparkles, Check, Plus, Shield } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { userService } from "../services/userService";
import { foodService } from "../services/foodService";
import { UserAddress, Category } from "../types";
import { MOCK_CATEGORIES } from "../data/mockData";

export const UserProfilePage: React.FC = () => {
  const { user, updateUser, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "preferences">("profile");

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || "Nguyễn Văn A");
  const [phone, setPhone] = useState(user?.phone || "0901234567");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientPhone, setNewRecipientPhone] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newDistrict, setNewDistrict] = useState("Quận 1");
  const [newCity, setNewCity] = useState("TP. Hồ Chí Minh");

  // RecSys Preferences State
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [preferredCats, setPreferredCats] = useState<string[]>(["cat-1", "cat-3"]);
  const [budget, setBudget] = useState(65000);
  const [dailyCalo, setDailyCalo] = useState(1800);
  const [proteinMin, setProteinMin] = useState(30);
  const [dietaryGoals, setDietaryGoals] = useState<string[]>(["Eat Clean", "Ít dầu mỡ"]);
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // 1. Fetch Profile
      userService.getProfile().then((data) => {
        if (data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.phone) setPhone(data.phone);
        }
      }).catch(() => {});

      // 2. Fetch Addresses
      userService.getAddresses().then((addrs) => {
        if (addrs) setAddresses(addrs);
      }).catch(() => {});

      // 3. Fetch Preferences
      userService.getPreferences().then((pref) => {
        if (pref) {
          if (pref.preferred_categories) setPreferredCats(pref.preferred_categories);
          if (pref.budget_per_meal) setBudget(pref.budget_per_meal);
          if (pref.daily_calorie_target) setDailyCalo(pref.daily_calorie_target);
          if (pref.preferred_protein_min) setProteinMin(pref.preferred_protein_min);
          if (pref.dietary_restrictions) setDietaryGoals(pref.dietary_restrictions);
        }
      }).catch(() => {});
    }

    foodService.getCategories().then((cats) => {
      if (cats && cats.length > 0) setCategories(cats);
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await userService.updateProfile({ full_name: fullName, phone });
      updateUser({ full_name: fullName, phone });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const added = await userService.addAddress({
        recipient_name: newRecipientName,
        recipient_phone: newRecipientPhone,
        address_line: newAddressLine,
        district: newDistrict,
        city: newCity,
        is_default: addresses.length === 0,
      });
      setAddresses((prev) => [...prev, added]);
      setIsAddAddressOpen(false);
      setNewRecipientName("");
      setNewRecipientPhone("");
      setNewAddressLine("");
    } catch (err: any) {
      alert(err.response?.data?.message || "Thêm địa chỉ thất bại");
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPref(true);
    try {
      await userService.updatePreferences({
        preferred_categories: preferredCats,
        budget_per_meal: budget,
        daily_calorie_target: dailyCalo,
        preferred_protein_min: proteinMin,
        dietary_restrictions: dietaryGoals,
        is_onboarded: true,
      });
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Cập nhật sở thích thất bại");
    } finally {
      setIsSavingPref(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setPreferredCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
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
          Sổ địa chỉ giao hàng ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "preferences" ? "bg-violet-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sở thích & Dinh dưỡng AI</span>
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 max-w-xl">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="h-16 w-16 rounded-full bg-orange-100 text-primary flex items-center justify-center font-black text-xl">
              {fullName.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{fullName || "Người dùng"}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 mt-1">
                Vai trò: {user?.role || "CUSTOMER"}
              </span>
            </div>
          </div>

          <Input
            label="Họ và tên hiển thị"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Địa chỉ Email"
            value={user?.email || ""}
            disabled
            className="bg-slate-50 text-slate-400"
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" isLoading={isSavingProfile}>
              Lưu thay đổi
            </Button>
            {profileSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="h-4 w-4" /> Đã cập nhật thành công!
              </span>
            )}
          </div>
        </form>
      )}

      {/* TAB 2: ADDRESSES */}
      {activeTab === "addresses" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">Danh sách địa chỉ của bạn:</span>
            <Button size="sm" onClick={() => setIsAddAddressOpen(true)} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Thêm địa chỉ mới
            </Button>
          </div>

          <div className="space-y-3">
            {addresses.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center bg-white rounded-2xl border border-slate-100">
                Chưa có địa chỉ nào được lưu. Hãy thêm địa chỉ để nhận hàng thuận tiện!
              </p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-bold text-slate-900">{addr.recipient_name} ({addr.recipient_phone})</span>
                      {addr.is_default && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-primary">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 pl-6">
                      {addr.address_line}, {addr.district}, {addr.city}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Modal
            isOpen={isAddAddressOpen}
            onClose={() => setIsAddAddressOpen(false)}
            title="Thêm địa chỉ giao hàng mới"
          >
            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ tên người nhận</label>
                <Input
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                <Input
                  value={newRecipientPhone}
                  onChange={(e) => setNewRecipientPhone(e.target.value)}
                  placeholder="VD: 0901234567"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Số nhà, tên đường</label>
                <Input
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quận / Huyện</label>
                  <Input
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tỉnh / Thành phố</label>
                  <Input
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddAddressOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Lưu địa chỉ</Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* TAB 3: AI RECSYS PREFERENCES */}
      {activeTab === "preferences" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 max-w-2xl">
          <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-violet-900">Huấn luyện hồ sơ khẩu vị của bạn</h3>
              <p className="text-[11px] text-violet-700 leading-relaxed mt-0.5">
                Các thông số này sẽ trực tiếp điều chỉnh trọng số hàm gợi ý (Content-Based Vector & SVD Factorization) để ưu tiên các món chuẩn chỉ số dinh dưỡng bạn đề ra.
              </p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Thể loại món ăn yêu thích:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((c) => {
                const isSelected = preferredCats.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{c.icon_url || "🍲"}</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Ngân sách lý tưởng mỗi bữa:</label>
              <span className="text-xs font-extrabold text-primary">{budget.toLocaleString("vi-VN")} đ</span>
            </div>
            <input
              type="range"
              min="30000"
              max="150000"
              step="5000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Calories */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Mục tiêu Calo hàng ngày:</label>
              <span className="text-xs font-bold text-orange-600">{dailyCalo} kcal / ngày</span>
            </div>
            <input
              type="range"
              min="1200"
              max="3200"
              step="50"
              value={dailyCalo}
              onChange={(e) => setDailyCalo(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          {/* Protein */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Mức Protein mong muốn mỗi bữa:</label>
              <span className="text-xs font-bold text-emerald-600">&ge; {proteinMin} g đạm</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="5"
              value={proteinMin}
              onChange={(e) => setProteinMin(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="ai"
              onClick={handleSavePreferences}
              isLoading={isSavingPref}
            >
              Cập nhật Hồ sơ Gu ẩm thực
            </Button>
            {prefSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="h-4 w-4" /> Đã lưu thành công!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
