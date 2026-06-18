import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useSchedulesStore } from "../store/schedulesStore";
import { scheduleNotificationForRecurrence, showNotification } from "../lib/notification";
import { syncNativeSchedules } from "../lib/nativeNotifications";

/**
 * 登録済みの予定に対して通知をスケジュールする。
 * - ネイティブ(Capacitor)実行時: OS標準のローカル通知に登録するため、
 *   アプリを完全に閉じていても指定時刻に確実に発火する。
 * - Web/PWA実行時: ページ内タイマーで代替するため、タブ／PWAを開いている間のみ発火する
 *   （システム設計書 5章「通知機能の技術方針」参照）。
 */
export function useScheduleNotifications(onFire: (scheduleId: string) => void) {
  const schedules = useSchedulesStore((s) => s.schedules);
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      syncNativeSchedules(schedules);
      return;
    }

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
