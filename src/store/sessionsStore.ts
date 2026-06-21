import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CheckSession } from "../types";
import { uuid } from "../lib/uuid";
import { toDateKey } from "../lib/recurrence";

const MAX_SESSIONS = 200;

interface SessionsState {
  sessions: CheckSession[];
  /** 今日のセッションを作成または既存項目との差分同期を行う(項目が変わらない場合は何もしない) */
  ensureTodaySession: (itemIds: string[]) => void;
  toggleItem: (sessionId: string, itemId: string) => void;
}

function buildSession(itemIds: string[]): CheckSession {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    targetDate: toDateKey(new Date()),
    items: itemIds.map((itemId) => ({ itemId, checked: false })),
    startedAt: now,
    status: "in_progress",
  };
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      ensureTodaySession: (itemIds) => {
        const todayKey = toDateKey(new Date());
        const now = new Date().toISOString();
        const sessions = get().sessions;
        const idx = sessions.findIndex((s) => s.targetDate === todayKey);

        if (idx === -1) {
          set({ sessions: [buildSession(itemIds), ...sessions].slice(0, MAX_SESSIONS) });
          return;
        }

        const existing = sessions[idx];
        const existingById = new Map(existing.items.map((r) => [r.itemId, r]));
        const items = itemIds.map((id) => existingById.get(id) ?? { itemId: id, checked: false });
        const unchanged =
          items.length === existing.items.length &&
          items.every((r, i) => r.itemId === existing.items[i].itemId);
        if (unchanged) return;

        const allChecked = items.length > 0 && items.every((r) => r.checked);
        const updatedSession: CheckSession = {
          ...existing,
          items,
          status: allChecked ? "completed" : "in_progress",
          completedAt: allChecked ? (existing.completedAt ?? now) : undefined,
        };
        const nextSessions = [...sessions];
        nextSessions[idx] = updatedSession;
        set({ sessions: nextSessions });
      },
      toggleItem: (sessionId, itemId) => {
        const now = new Date().toISOString();
        set({
          sessions: get().sessions.map((session) => {
            if (session.id !== sessionId) return session;
            const items = session.items.map((result) =>
              result.itemId === itemId
                ? {
                    ...result,
                    checked: !result.checked,
                    checkedAt: !result.checked ? now : undefined,
                  }
                : result,
            );
            const allChecked = items.length > 0 && items.every((r) => r.checked);
            return {
              ...session,
              items,
              status: allChecked ? "completed" : "in_progress",
              completedAt: allChecked ? now : undefined,
            };
          }),
        });
      },
    }),
    { name: "derukaku:sessions", storage: createJSONStorage(() => localStorage) },
  ),
);
