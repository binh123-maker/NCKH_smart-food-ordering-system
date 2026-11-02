import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Food } from "../types";

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  isDrawerOpen: boolean;
  conflictItem: { food: Food; quantity: number; notes?: string } | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (food: Food, quantity?: number, notes?: string, forceClear?: boolean) => boolean;
  clearConflict: () => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      isDrawerOpen: false,
      conflictItem: null,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addItem: (food, quantity = 1, notes, forceClear = false) => {
        const { restaurantId, items } = get();

        // Single Restaurant Policy check
        if (restaurantId && restaurantId !== food.restaurant_id && food.restaurant_id) {
          if (!forceClear) {
            set({ conflictItem: { food, quantity, notes } });
            return false;
          }
          // Clear and switch restaurant
          const newItem: CartItem = {
            id: `ci-${Date.now()}`,
            food_id: food.id,
            food_name: food.name,
            unit_price: food.price,
            quantity,
            subtotal: food.price * quantity,
            image_url: food.image_url,
            notes,
            is_available: food.is_available,
          };
          set({
            items: [newItem],
            restaurantId: food.restaurant_id,
            restaurantName: food.restaurant?.name || "Nhà hàng",
            conflictItem: null,
            isDrawerOpen: true,
          });
          return true;
        }

        // Add or increment
        const existingIndex = items.findIndex((i) => i.food_id === food.id);
        let newItems: CartItem[];

        if (existingIndex > -1) {
          newItems = [...items];
          const exist = newItems[existingIndex];
          const newQty = exist.quantity + quantity;
          newItems[existingIndex] = {
            ...exist,
            quantity: newQty,
            subtotal: exist.unit_price * newQty,
            notes: notes || exist.notes,
          };
        } else {
          newItems = [
            ...items,
            {
              id: `ci-${Date.now()}`,
              food_id: food.id,
              food_name: food.name,
              unit_price: food.price,
              quantity,
              subtotal: food.price * quantity,
              image_url: food.image_url,
              notes,
              is_available: food.is_available,
            },
          ];
        }

        set({
          items: newItems,
          restaurantId: food.restaurant_id || restaurantId,
          restaurantName: food.restaurant?.name || get().restaurantName || "Nhà hàng",
          isDrawerOpen: true,
          conflictItem: null,
        });
        return true;
      },

      clearConflict: () => set({ conflictItem: null }),

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity, subtotal: item.unit_price * quantity }
              : item
          ),
        }));
      },

      removeItem: (itemId) => {
        set((state) => {
          const remaining = state.items.filter((item) => item.id !== itemId);
          return {
            items: remaining,
            restaurantId: remaining.length === 0 ? null : state.restaurantId,
            restaurantName: remaining.length === 0 ? null : state.restaurantName,
          };
        });
      },

      clearCart: () =>
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          conflictItem: null,
        }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),
      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "food_recsys_cart",
    }
  )
);

