import { useEffect, useMemo, useRef, useState } from "react";
import { CheckRow } from "../../components/CheckRow";
import { ToastStack } from "../../components/Toast";
import type { ToastItem } from "../../components/Toast";
import { useSchedulesStore } from "../../store/schedulesStore";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { useSessionsStore } from "../../store/sessionsStore";
import { useSettingsStore } from "../../store/settingsStore";
import { toDateKey } from "../../lib/recurrence";
import { resolveTodayItems } from "../../lib/dedupe";
import { uuid } from "../../lib/uuid";
import { playComplete } from "../../lib/sound";

export default function HomePage() {
  const schedules = useSchedulesStore((s) => s.schedules);
  const sets = useSetsStore((s) => s.sets);
  const updateSet = useSetsStore((s) => s.updateSet);
  const items = useItemsStore((s) => s.items);
  const sessions = useSessionsStore((s) => s.sessions);
  const ensureTodaySession = useSessionsStore((s) => s.ensureTodaySession);
  const toggleItem = useSessionsStore((s) => s.toggleItem);
  const homeBackgroundImage = useSettingsStore((s) => s.homeBackgroundImage);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const todayItems = useMemo(
    () => resolveTodayItems(schedules, sets, items, today),
    [schedules, sets, items, today],
  );
  const todayItemIds = useMemo(() => todayItems.map((t) => t.item.id), [todayItems]);

  useEffect(() => {
    ensureTodaySession(todayItemIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayItemIds.join(",")]);

  const session = sessions.find((s) => s.targetDate === todayKey);
  const checkedById = useMemo(
    () => new Map(session?.items.map((r) => [r.itemId, r.checked]) ?? []),
    [session],
  );

  const allChecked = todayItems.length > 0 && todayItems.every((t) => checkedById.get(t.item.id));
  const prevAllCheckedRef = useRef(allChecked);
  useEffect(() => {
    if (allChecked && !prevAllCheckedRef.current) {
      playComplete();
    }
    prevAllCheckedRef.current = allChecked;
  }, [allChecked]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleSwipeExclude = (itemId: string, itemName: string, setIds: string[]) => {
    setIds.forEach((setId) => {
      const itemSet = sets.find((s) => s.id === setId);
      if (!itemSet) return;
      updateSet(setId, { itemIds: itemSet.itemIds.filter((id) => id !== itemId) });
      setToasts((prev) => [
        ...prev,
        {
          id: uuid(),
          message: `「${itemName}」を${itemSet.name}から除外しました`,
          onUndo: () => {
            const current = useSetsStore.getState().sets.find((s) => s.id === setId);
            if (!current || current.itemIds.includes(itemId)) return;
            updateSet(setId, { itemIds: [...current.itemIds, itemId] });
          },
        },
      ]);
    });
  };

  return (
    <div
      className={`page${homeBackgroundImage ? " page-bg-image" : ""}`}
      style={homeBackgroundImage ? { backgroundImage: `url(${homeBackgroundImage})` } : undefined}
    >
      <h1 className="page-title">今日の確認</h1>

      <div className="stack" style={{ marginBottom: "var(--space-5)" }}>
        {todayItems.length === 0 && (
          <div className="empty-state card">今日の確認項目はありません</div>
        )}
        {todayItems.map(({ item, setIds }) => (
          <CheckRow
            key={item.id}
            label={item.name}
            icon={item.icon}
            checked={checkedById.get(item.id) ?? false}
            onToggle={() => session && toggleItem(session.id, item.id)}
            onSwipeExclude={
              setIds.length > 0 ? () => handleSwipeExclude(item.id, item.name, setIds) : undefined
            }
          />
        ))}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
