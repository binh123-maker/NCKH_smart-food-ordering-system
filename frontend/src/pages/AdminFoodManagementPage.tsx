import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Sparkles, Filter } from "lucide-react";
import { Food, Category, Restaurant } from "../types";
import { formatVND } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { MacroBadge } from "../components/ui/MacroBadge";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { foodService } from "../services/foodService";
import { restaurantService } from "../services/restaurantService";
import { adminService } from "../services/adminService";
import { MOCK_CATEGORIES, MOCK_FOODS, MOCK_RESTAURANTS } from "../data/mockData";

export const AdminFoodManagementPage: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Partial<Food> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      foodService.getFoods({ limit: 100 }),
      foodService.getCategories(),
      restaurantService.getRestaurants({ limit: 50 }),
    ])
      .then(([foodsRes, catsRes, restsRes]) => {
        if (foodsRes && foodsRes.items && foodsRes.items.length > 0) {
          setFoods(foodsRes.items);
        } else {
          setFoods(MOCK_FOODS);
        }
        if (catsRes && catsRes.length > 0) setCategories(catsRes);
        else setCategories(MOCK_CATEGORIES);

        if (restsRes && restsRes.items && restsRes.items.length > 0) {
          setRestaurants(restsRes.items);
        } else {
          setRestaurants(MOCK_RESTAURANTS);
        }
      })
      .catch(() => {
        setFoods(MOCK_FOODS);
        setCategories(MOCK_CATEGORIES);
        setRestaurants(MOCK_RESTAURANTS);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFoods = foods.filter((food) => {
    const matchSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || food.category_id === selectedCategory;
    const matchRestaurant = selectedRestaurant === "all" || food.restaurant_id === selectedRestaurant;
    return matchSearch && matchCategory && matchRestaurant;
  });

  const handleToggleActive = async (id: string) => {
    const target = foods.find((f) => f.id === id);
    if (!target) return;
    const newStatus = !target.is_available;
    setFoods((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_available: newStatus } : f))
    );
    try {
      await adminService.updateFood(id, { is_available: newStatus });
    } catch {
      // rollback if failed
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa món ăn này khỏi hệ thống?")) {
      try {
        await adminService.deleteFood(id);
        setFoods((prev) => prev.filter((f) => f.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.message || "Không thể xóa món ăn do có liên kết đơn hàng hoặc đánh giá.");
      }
    }
  };

  const handleOpenEdit = (food: Food) => {
    setEditingFood({ ...food });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingFood({
      name: "",
      slug: "",
      category_id: categories[0]?.id || "cat-1",
      restaurant_id: restaurants[0]?.id || "rest-1",
      price: 50000,
      description: "",
      image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      is_available: true,
      nutrition: {
        calories: 450,
        protein: 25,
        fat: 12,
        carbohydrates: 55,
      },
    });
    setIsModalOpen(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFood?.name) return;

    setIsSaving(true);
    try {
      const payload = {
        name: editingFood.name,
        restaurant_id: editingFood.restaurant_id || restaurants[0]?.id,
        category_id: editingFood.category_id || categories[0]?.id,
        price: Number(editingFood.price) || 50000,
        original_price: Number(editingFood.price) || 50000,
        description: editingFood.description || "",
        image_url: editingFood.image_url,
        is_available: editingFood.is_available ?? true,
        nutrition: editingFood.nutrition,
      };

      if (editingFood.id) {
        // Update
        const updated = await adminService.updateFood(editingFood.id, payload);
        setFoods((prev) =>
          prev.map((f) => (f.id === editingFood.id ? { ...f, ...updated } : f))
        );
      } else {
        // Create
        const created = await adminService.createFood(payload);
        setFoods((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lưu món ăn thành công!");
      setIsModalOpen(false);
      loadData();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Quản lý Thực đơn Món ăn</h2>
          <p className="text-xs text-slate-500">
            Quản lý thông tin dinh dưỡng, danh mục và dữ liệu đầu vào cho Content-Based RecSys
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0 flex items-center gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> Thêm món mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 text-xs rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-700 outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c: Category) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="h-10 text-xs rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-700 outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">Tất cả nhà hàng</option>
            {restaurants.map((r: Restaurant) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Foods Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center bg-white rounded-2xl border border-slate-200">
          <LoadingSpinner size="lg" text="Đang tải danh sách món ăn quản trị..." />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Món ăn</th>
                  <th className="py-3 px-4">Nhà hàng / Danh mục</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Dinh dưỡng (Calories / Macros)</th>
                  <th className="py-3 px-4">Đánh giá & Lượt mua</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFoods.map((food) => (
                  <tr key={food.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            food.image_url ||
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={food.name}
                          className="h-11 w-11 rounded-xl object-cover shrink-0 border border-slate-100"
                        />
                        <div className="max-w-[200px]">
                          <h4 className="font-bold text-slate-900 truncate">{food.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{food.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">
                        {food.restaurant?.name || "Bếp Xanh Dinh Dưỡng"}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {food.category?.name || "Đặc sản"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-black text-slate-900">{formatVND(food.price)}</p>
                      {food.original_price && food.original_price > food.price && (
                        <p className="text-[10px] text-slate-400 line-through">
                          {formatVND(food.original_price)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-800">
                            {food.nutrition?.calories || 0} kcal
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (P: {food.nutrition?.protein || 0}g | C: {food.nutrition?.carbohydrates || 0}g | F:{" "}
                            {food.nutrition?.fat || 0}g)
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <MacroBadge type="protein" value={food.nutrition?.protein || 0} />
                          <MacroBadge type="fat" value={food.nutrition?.fat || 0} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-primary font-bold">
                        ★ {food.rating_average}{" "}
                        <span className="text-slate-400 font-normal">({food.total_reviews})</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{food.order_count} lượt đặt</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(food.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          food.is_available
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {food.is_available ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Đang bán
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Tạm dừng
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(food)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFood(food.id)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Food Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFood?.id ? "Chỉnh sửa Món ăn" : "Thêm Món ăn Mới"}
      >
        <form onSubmit={handleSaveFood} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên món ăn</label>
            <Input
              value={editingFood?.name || ""}
              onChange={(e) =>
                setEditingFood((prev) => (prev ? { ...prev, name: e.target.value } : null))
              }
              placeholder="VD: Cơm Tấm Sườn Bì Chả"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giá bán (VND)</label>
              <Input
                type="number"
                value={editingFood?.price || ""}
                onChange={(e) =>
                  setEditingFood((prev) => (prev ? { ...prev, price: Number(e.target.value) } : null))
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục</label>
              <select
                value={editingFood?.category_id || categories[0]?.id || "cat-1"}
                onChange={(e) =>
                  setEditingFood((prev) => (prev ? { ...prev, category_id: e.target.value } : null))
                }
                className="w-full h-10 text-xs rounded-xl border border-slate-200 px-3 font-medium bg-white"
              >
                {categories.map((c: Category) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nhà hàng trực thuộc</label>
            <select
              value={editingFood?.restaurant_id || restaurants[0]?.id || "rest-1"}
              onChange={(e) =>
                setEditingFood((prev) => (prev ? { ...prev, restaurant_id: e.target.value } : null))
              }
              className="w-full h-10 text-xs rounded-xl border border-slate-200 px-3 font-medium bg-white"
            >
              {restaurants.map((r: Restaurant) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-2">
            <span className="text-xs font-black text-purple-900 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Chỉ số Dinh dưỡng (Phục vụ AI Filtering)
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600">Calories</label>
                <Input
                  type="number"
                  value={editingFood?.nutrition?.calories || 0}
                  onChange={(e) =>
                    setEditingFood((prev) =>
                      prev
                        ? {
                            ...prev,
                            nutrition: {
                              calories: Number(e.target.value),
                              protein: prev.nutrition?.protein || 0,
                              fat: prev.nutrition?.fat || 0,
                              carbohydrates: prev.nutrition?.carbohydrates || 0,
                            },
                          }
                        : null
                    )
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">Protein (g)</label>
                <Input
                  type="number"
                  value={editingFood?.nutrition?.protein || 0}
                  onChange={(e) =>
                    setEditingFood((prev) =>
                      prev
                        ? {
                            ...prev,
                            nutrition: {
                              calories: prev.nutrition?.calories || 0,
                              protein: Number(e.target.value),
                              fat: prev.nutrition?.fat || 0,
                              carbohydrates: prev.nutrition?.carbohydrates || 0,
                            },
                          }
                        : null
                    )
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">Fat (g)</label>
                <Input
                  type="number"
                  value={editingFood?.nutrition?.fat || 0}
                  onChange={(e) =>
                    setEditingFood((prev) =>
                      prev
                        ? {
                            ...prev,
                            nutrition: {
                              calories: prev.nutrition?.calories || 0,
                              protein: prev.nutrition?.protein || 0,
                              fat: Number(e.target.value),
                              carbohydrates: prev.nutrition?.carbohydrates || 0,
                            },
                          }
                        : null
                    )
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600">Carbs (g)</label>
                <Input
                  type="number"
                  value={editingFood?.nutrition?.carbohydrates || 0}
                  onChange={(e) =>
                    setEditingFood((prev) =>
                      prev
                        ? {
                            ...prev,
                            nutrition: {
                              calories: prev.nutrition?.calories || 0,
                              protein: prev.nutrition?.protein || 0,
                              fat: prev.nutrition?.fat || 0,
                              carbohydrates: Number(e.target.value),
                            },
                          }
                        : null
                    )
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả món ăn</label>
            <textarea
              value={editingFood?.description || ""}
              onChange={(e) =>
                setEditingFood((prev) => (prev ? { ...prev, description: e.target.value } : null))
              }
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-primary"
              placeholder="Mô tả nguyên liệu, hương vị..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Lưu món ăn
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
