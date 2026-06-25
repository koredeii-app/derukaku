import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useSettingsStore } from "../store/settingsStore";
import { useSessionsStore } from "../store/sessionsStore";
import { toDateKey } from "../lib/recurrence";
import { scheduleStandingNotification, showNotification, syncNativeStandingNotification } from "../lib/notification";

/**
 * 「今日の確認をしてください」というアプリ全体で1つの通知をスケジュールする。
 * - ネイティブ(Capacitor)実行時: OS標準のローカル通知に登録するため、
 *   アプリを完全に閉じていても指定時刻に確実に発火する。
 * - Web/PWA実行時: ページ内タイマーで代替するため、タブ／PWAを開いている間のみ発火する
 *   （システム設計書 5章「通知機能の技術方針」参照）。
 */
export function useScheduleNotifications(onFire: () => void) {
  const notificationMode = useSettingsStore((s) => s.notificationMode);
  const notificationTime = useSettingsStore((s) => s.notificationTime);
  const notificationCustomDays = useSettingsStore((s) => s.notificationCustomDays);
  const notificationPermission = useSettingsStore((s) => s.notificationPermission);
  const todayCompleted = useSessionsStore((s) => {
    const todayKey = toDateKey(new Date());
    return s.sessions.find((session) => session.targetDate === todayKey)?.status === "completed";
  });
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      if (notificationPermission !== "granted") return;

      const sync = () =>
        syncNativeStandingNotification(
          notificationMode,
          notificationTime,
          notificationCustomDays,
          todayCompleted,
        ).catch((err) => console.error("Failed to sync native notification", err));
      sync();

      // 設定画面で「アラームとリマインダー」許可を変更して戻ってきた際に、
      // 正確なアラームで再スケジュールし直すため。
      document.addEventListener("visibilitychange", sync);
      return () => document.removeEventListener("visibilitychange", sync);
    }

    const cancel = scheduleStandingNotification(
      notificationMode,
      notificationTime,
      notificationCustomDays,
      () => {
        showNotification("デルカク✓ の時間です", "出発前の忘れ物チェックをしましょう");
        onFireRef.current();
      },
    );
    return cancel;
    // todayCompleted はネイティブ側の再スケジュール(=今日完了後の強制完了)にのみ使うため依存に含める
  }, [notificationMode, notificationTime, notificationCustomDays, notificationPermission, todayCompleted]);
}
