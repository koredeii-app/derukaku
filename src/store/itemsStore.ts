import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Item } from "../types";
import { uuid } from "../lib/uuid";

interface ItemsState {
  items: Item[];
  addItem: (name: string, icon?: string) => Item;
  updateItem: (id: string, patch: Partial<Pick<Item, "name" | "icon">>) => void;
  removeItem: (id: string) => void;
}

export const useItemsStore = create<ItemsState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (name, icon) => {
        const now = new Date().toISOString();
        const item: Item = { id: uuid(), name, icon, createdAt: now, updatedAt: now };
        set({ items: [...get().items, item] });
        return item;
      },
      updateItem: (id, patch) => {
        const now = new Date().toISOString();
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: now } : item,
          ),
        });
      },
      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },
    }),
    { name: "derukaku:items", storage: createJSONStorage(() => localStorage) },
  ),
);
