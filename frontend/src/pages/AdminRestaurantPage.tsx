import React, { useState, useEffect } from "react";
import { Plus, Search, MapPin, Phone, Star, Edit2, Trash2 } from "lucide-react";
import { Restaurant } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { restaurantService } from "../services/restaurantService";
import { MOCK_RESTAURANTS } from "../data/mockData";

export const AdminRestaurantPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Partial<Restaurant> | null>(null);

  const fetchRestaurants = () => {
    setIsLoading(true);
    restaurantService
      .getRestaurants()
      .then((res) => {
        if (res && res.items && res.items.length > 0) {
          setRestaurants(res.items);
        } else {
          setRestaurants(MOCK_RESTAURANTS);
        }
      })
      .catch(() => {
        setRestaurants(MOCK_RESTAURANTS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingRes({
      name: "",
      slug: "",
      address: "",
      phone: "",
      rating_average: 5.0,
      total_reviews: 0,
      image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
      is_active: true,
      opening_hours: "07:00 - 22:00",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: Restaurant) => {
    setEditingRes({ ...res });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa nhà hàng này?")) {
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRes?.name) return;

    if (editingRes.id) {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === editingRes.id ? ({ ...r, ...editingRes } as Restaurant) : r))
      );
    } else {
      const newRes: Restaurant = {
        id: `rest-${Date.now()}`,
        name: editingRes.name || "Nhà hàng mới",
        slug: editingRes.name?.toLowerCase().replace(/\s+/g, "-") || "nha-hang-moi",
        address: editingRes.address || "Hà Nội",
        phone: editingRes.phone || "0987654321",
        rating_average: 5.0,
        total_reviews: 0,
        image_url:
          editingRes.image_url ||
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        is_active: true,
        opening_hours: editingRes.opening_hours || "07:00 - 22:00",
        distance_km: 2.5,
      };
      setRestaurants((prev) => [newRes, ...prev]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Quản lý Đối tác Nhà hàng</h2>
          <p className="text-xs text-slate-500">Quản lý thông tin chuỗi cơ sở ẩm thực liên kết hệ thống</p>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0 flex items-center gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> Thêm nhà hàng
        </Button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên nhà hàng hoặc địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center bg-white rounded-2xl border border-slate-200">
          <LoadingSpinner size="lg" text="Đang tải danh sách nhà hàng đối tác..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative h-36">
                  <img
                    src={
                      res.image_url ||
                      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={res.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {res.rating_average}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">{res.name}</h3>
                  <div className="space-y-1 text-slate-500 text-xs">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{res.address}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{res.phone}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                <span className="text-[11px] font-bold text-emerald-600">
                  {res.opening_hours}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(res)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRes?.id ? "Chỉnh sửa Nhà hàng" : "Thêm Nhà hàng Mới"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên nhà hàng</label>
            <Input
              value={editingRes?.name || ""}
              onChange={(e) => setEditingRes((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              placeholder="VD: Cơm Tấm Ba Ghiền"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ</label>
            <Input
              value={editingRes?.address || ""}
              onChange={(e) => setEditingRes((prev) => (prev ? { ...prev, address: e.target.value } : null))}
              placeholder="VD: 84 Đặng Văn Ngữ, Phú Nhuận"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
              <Input
                value={editingRes?.phone || ""}
                onChange={(e) => setEditingRes((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                placeholder="0912345678"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khung giờ mở cửa</label>
              <Input
                value={editingRes?.opening_hours || "07:00 - 22:00"}
                onChange={(e) => setEditingRes((prev) => (prev ? { ...prev, opening_hours: e.target.value } : null))}
                placeholder="07:00 - 22:00"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu nhà hàng</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
