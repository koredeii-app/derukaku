import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NotificationConfig, Recurrence, ScheduleEntry } from "../types";
import { uuid } from "../lib/uuid";

type NewSchedule = {
  recurrence: Recurrence;
  setIds: string[];
  itemIds: string[];
  notification: NotificationConfig;
};

interface SchedulesState {
  schedules: ScheduleEntry[];
  addSchedule: (input: NewSchedule) => ScheduleEntry;
  updateSchedule: (id: string, patch: Partial<NewSchedule>) => void;
  removeSchedule: (id: string) => void;
  removeSetReference: (setId: string) => void;
  removeItemReference: (itemId: string) => void;
}

export const useSchedulesStore = create<SchedulesState>()(
  persist(
    (set, get) => ({
      schedules: [],
      addSchedule: (input) => {
        const now = new Date().toISOString();
        const entry: ScheduleEntry = { id: uuid(), ...input, createdAt: now, updatedAt: now };
        set({ schedules: [...get().schedules, entry] });
        return entry;
      },
      updateSchedule: (id, patch) => {
        const now = new Date().toISOString();
        set({
          schedules: get().schedules.map((s) =>
            s.id === id ? { ...s, ...patch, updatedAt: now } : s,
          ),
        });
      },
      removeSchedule: (id) => {
        set({ schedules: get().schedules.filter((s) => s.id !== id) });
      },
      removeSetReference: (setId) => {
        const now = new Date().toISOString();
        set({
          schedules: get().schedules.map((s) =>
            s.setIds.includes(setId)
              ? { ...s, setIds: s.setIds.filter((id) => id !== setId), updatedAt: now }
              : s,
          ),
        });
      },
      removeItemReference: (itemId) => {
        const now = new Date().toISOString();
        set({
          schedules: get().schedules.map((s) =>
            s.itemIds.includes(itemId)
              ? { ...s, itemIds: s.itemIds.filter((id) => id !== itemId), updatedAt: now }
              : s,
          ),
        });
      },
    }),
    { name: "derukaku:schedules", storage: createJSONStorage(() => localStorage) },
  ),
);
