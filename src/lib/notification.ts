import type { NotificationPermissionState, Recurrence } from "../types";
import { matchesDate } from "./recurrence";

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

export function scheduleOnce(delayMs: number, onFire: () => void): () => void {
  const timeoutId = setTimeout(onFire, delayMs);
  return () => clearTimeout(timeoutId);
}

/**
 * 予定の繰り返し設定に応じて通知タイマーを仕込む。
 * - once: 指定日時の一度だけ（過去の日時なら仕込まない）
 * - daily / weekly: 毎日チェックし、recurrence に合致する日だけ fire する
 */
export function scheduleNotificationForRecurrence(
  recurrence: Recurrence,
  time: string,
  onFire: () => void,
): () => void {
  if (recurrence.type === "once") {
    if (!recurrence.date) return () => {};
    const [hour, minute] = time.split(":").map(Number);
    const [year, month, day] = recurrence.date.split("-").map(Number);
    const target = new Date(year, month - 1, day, hour, minute, 0, 0);
    const delay = target.getTime() - Date.now();
    if (delay <= 0) return () => {};
    return scheduleOnce(delay, onFire);
  }
  return scheduleDaily(time, () => {
    if (matchesDate(recurrence, new Date())) onFire();
  });
}
