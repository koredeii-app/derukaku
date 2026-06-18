import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ItemSet } from "../types";
import { uuid } from "../lib/uuid";

interface SetsState {
  sets: ItemSet[];
  addSet: (name: string, itemIds: string[]) => ItemSet;
  updateSet: (id: string, patch: Partial<Pick<ItemSet, "name" | "itemIds">>) => void;
  removeSet: (id: string) => void;
  removeItemReference: (itemId: string) => void;
}

export const useSetsStore = create<SetsState>()(
  persist(
    (set, get) => ({
      sets: [],
      addSet: (name, itemIds) => {
        const now = new Date().toISOString();
        const itemSet: ItemSet = { id: uuid(), name, itemIds, createdAt: now, updatedAt: now };
        set({ sets: [...get().sets, itemSet] });
        return itemSet;
      },
      updateSet: (id, patch) => {
        const now = new Date().toISOString();
        set({
          sets: get().sets.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: now } : s)),
        });
      },
      removeSet: (id) => {
        set({ sets: get().sets.filter((s) => s.id !== id) });
      },
      removeItemReference: (itemId) => {
        const now = new Date().toISOString();
        set({
          sets: get().sets.map((s) =>
            s.itemIds.includes(itemId)
              ? { ...s, itemIds: s.itemIds.filter((id) => id !== itemId), updatedAt: now }
              : s,
          ),
        });
      },
    }),
    { name: "derukaku:sets", storage: createJSONStorage(() => localStorage) },
  ),
);
