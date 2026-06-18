import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CheckSession } from "../types";
import { uuid } from "../lib/uuid";

const MAX_SESSIONS = 200;

interface SessionsState {
  sessions: CheckSession[];
  startSession: (itemIds: string[], scheduleEntryId?: string) => CheckSession;
  toggleItem: (sessionId: string, itemId: string) => CheckSession | undefined;
  abandonSession: (sessionId: string) => void;
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      startSession: (itemIds, scheduleEntryId) => {
        const now = new Date().toISOString();
        const session: CheckSession = {
          id: uuid(),
          scheduleEntryId,
          targetDate: now.slice(0, 10),
          items: itemIds.map((itemId) => ({ itemId, checked: false })),
          startedAt: now,
          status: "in_progress",
        };
        const sessions = [session, ...get().sessions].slice(0, MAX_SESSIONS);
        set({ sessions });
        return session;
      },
      toggleItem: (sessionId, itemId) => {
        const now = new Date().toISOString();
        let updated: CheckSession | undefined;
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
            const allChecked = items.every((r) => r.checked);
            updated = {
              ...session,
              items,
              status: allChecked ? "completed" : "in_progress",
              completedAt: allChecked ? now : undefined,
            };
            return updated;
          }),
        });
        return updated;
      },
      abandonSession: (sessionId) => {
        set({
          sessions: get().sessions.map((session) =>
            session.id === sessionId ? { ...session, status: "abandoned" } : session,
          ),
        });
      },
    }),
    { name: "derukaku:sessions", storage: createJSONStorage(() => localStorage) },
  ),
);
