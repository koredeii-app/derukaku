import { LocalNotifications } from "@capacitor/local-notifications";
import type { NotificationMode } from "../types";

const TITLE = "デルカク✓ の時間です";
const BODY = "出発前の忘れ物チェックをしましょう";
const STANDING_BASE_ID = 1;

export async function requestNativePermission(): Promise<boolean> {
  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

export async function getNativePermissionState(): Promise<boolean> {
  const result = await LocalNotifications.checkPermissions();
  return result.display === "granted";
}

type PendingNotification = {
  id: number;
  title: string;
  body: string;
  schedule: { on: { weekday?: number; hour: number; minute: number } };
};

function buildStandingNotifications(
  mode: NotificationMode,
  time: string,
  customDays: number[],
): PendingNotification[] {
  const [hour, minute] = time.split(":").map(Number);

  if (mode === "daily") {
    return [{ id: STANDING_BASE_ID, title: TITLE, body: BODY, schedule: { on: { hour, minute } } }];
  }

  // auto: 平日(月-金)のみ。weekday は Capacitor の仕様で 1=日〜7=土。
  const days = mode === "auto" ? [1, 2, 3, 4, 5] : customDays;
  return days.map((day) => ({
    id: STANDING_BASE_ID + day + 1,
    title: TITLE,
    body: BODY,
    schedule: { on: { weekday: day + 1, hour, minute } },
  }));
}

/**
 * 現在登録されているネイティブ通知をすべて取り消し、最新の通知設定で再スケジュールする。
 * OS側がスケジュールを管理するため、アプリが完全に閉じていても発火する。
 */
export async function syncStandingNativeNotification(
  mode: NotificationMode,
  time: string,
  customDays: number[],
): Promise<void> {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  const notifications = buildStandingNotifications(mode, time, customDays);
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}
