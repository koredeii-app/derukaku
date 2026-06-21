import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useSettingsStore } from "../store/settingsStore";
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
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      syncNativeStandingNotification(notificationMode, notificationTime, notificationCustomDays);
      return;
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
  }, [notificationMode, notificationTime, notificationCustomDays]);
}
