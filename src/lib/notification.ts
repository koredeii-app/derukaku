import { Capacitor } from "@capacitor/core";
import type { NotificationMode, NotificationPermissionState } from "../types";
import {
  checkExactAlarmPermission,
  getNativePermissionState,
  requestExactAlarmPermission,
  requestNativePermission,
  syncStandingNativeNotification,
} from "./nativeNotifications";

/** ネイティブ(Capacitor)とWebのどちらで動いていても、適切な方式で通知許可状態を取得する */
export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  if (Capacitor.isNativePlatform()) {
    return (await getNativePermissionState()) ? "granted" : "denied";
  }
  return getPermissionState();
}

/** ネイティブ(Capacitor)とWebのどちらで動いていても、適切な方式で通知許可をリクエストする */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (Capacitor.isNativePlatform()) {
    return (await requestNativePermission()) ? "granted" : "denied";
  }
  return requestPermission();
}

export function getPermissionState(): NotificationPermissionState {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission as NotificationPermissionState;
}

export async function requestPermission(): Promise<NotificationPermissionState> {
  if (typeof Notification === "undefined") return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

export function showNotification(title: string, body: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, tag: "derukaku-check" });
  n.onclick = () => {
    window.focus();
  };
}

/** 通知モードと曜日設定から、その日に通知すべきかどうかを判定する(0=日〜6=土) */
export function shouldFireToday(
  mode: NotificationMode,
  customDays: number[],
  date: Date,
): boolean {
  const day = date.getDay();
  if (mode === "daily") return true;
  if (mode === "auto") return day >= 1 && day <= 5;
  return customDays.includes(day);
}

/**
 * 指定時刻(HH:mm)に毎日 onFire を呼び出すタイマーを仕込む。
 * ブラウザの制約により、アプリ（タブ）が開いている間のみ確実に動作する。
 * 閉じている間の通知はブラウザ・OS依存となるため保証しない（システム設計書 5章参照）。
 */
export function scheduleDaily(time: string, onFire: () => void): () => void {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const tick = () => {
    onFire();
    timeoutId = setTimeout(tick, 24 * 60 * 60 * 1000);
  };

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  const delay = next.getTime() - now.getTime();
  timeoutId = setTimeout(tick, delay);

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
}

/**
 * アプリ全体で1つだけ持つ「今日の確認をしてください」通知をスケジュールする。
 * - 自動: 平日のみ / 毎日: 毎日 / カスタム: 指定した曜日のみ
 */
export function scheduleStandingNotification(
  mode: NotificationMode,
  time: string,
  customDays: number[],
  onFire: () => void,
): () => void {
  return scheduleDaily(time, () => {
    if (shouldFireToday(mode, customDays, new Date())) onFire();
  });
}

/** ネイティブ実行時、通知設定に応じてOS側の通知をすべて再スケジュールする */
export async function syncNativeStandingNotification(
  mode: NotificationMode,
  time: string,
  customDays: number[],
  todayCompleted: boolean,
): Promise<void> {
  await syncStandingNativeNotification(mode, time, customDays, todayCompleted);
}

/** ネイティブ実行時のみ意味を持つ。「正確なアラーム」がOSで許可されているか */
export async function getExactAlarmPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  return checkExactAlarmPermission();
}

/** ネイティブ実行時のみ意味を持つ。OSの「アラームとリマインダー」許可設定画面を開く */
export async function requestExactAlarmPermissionSetting(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  return requestExactAlarmPermission();
}
