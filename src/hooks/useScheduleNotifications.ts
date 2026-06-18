import { useEffect, useRef } from "react";
import { useSchedulesStore } from "../store/schedulesStore";
import { scheduleNotificationForRecurrence, showNotification } from "../lib/notification";

/**
 * 登録済みの予定に対して通知タイマーを仕込む。
 * ブラウザの制約上、このタブ／PWAが開いている間のみ確実に発火する
 * （システム設計書 5章「通知機能の技術方針」参照）。
 */
export function useScheduleNotifications(onFire: (scheduleId: string) => void) {
  const schedules = useSchedulesStore((s) => s.schedules);
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  useEffect(() => {
    const cancels = schedules
      .filter((s) => s.notification.enabled)
      .map((s) =>
        scheduleNotificationForRecurrence(s.recurrence, s.notification.time, () => {
          showNotification("デルカク✓ の時間です", "出発前の忘れ物チェックをしましょう");
          onFireRef.current(s.id);
        }),
      );
    return () => cancels.forEach((cancel) => cancel());
  }, [schedules]);
}
