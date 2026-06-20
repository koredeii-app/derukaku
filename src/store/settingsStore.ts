import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppSettings } from "../types";

interface SettingsState extends AppSettings {
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  fontSize: "standard",
  defaultSnoozeMinutes: 10,
  notificationPermission: "default",
  onboardingCompleted: false,
  themeColor: "blue",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (patch) => set((state) => ({ ...state, ...patch })),
    }),
    { name: "derukaku:settings", storage: createJSONStorage(() => localStorage) },
  ),
);
