import { LocalNotifications } from "@capacitor/local-notifications";
import type { ScheduleEntry } from "../types";

const TITLE = "デルカク✓ の時間です";
const BODY = "出発前の忘れ物チェックをしましょう";

function hashToInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 1_000_000) + 1;
}

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
  extra: { scheduleId: string };
  schedule: { at: Date } | { on: { weekday?: number; hour: number; minute: number } };
};

function buildNotifications(schedule: ScheduleEntry): PendingNotification[] {
  const [hour, minute] = schedule.notification.time.split(":").map(Number);
  const baseId = hashToInt(schedule.id);

  if (schedule.recurrence.type === "once") {
    if (!schedule.recurrence.date) return [];
    const [year, month, day] = schedule.recurrence.date.split("-").map(Number);
    const at = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (at.getTime() <= Date.now()) return [];
    return [
      { id: baseId, title: TITLE, body: BODY, extra: { scheduleId: schedule.id }, schedule: { at } },
    ];
  }

  if (schedule.recurrence.type === "daily") {
    return [
      {
        id: baseId,
        title: TITLE,
        body: BODY,
        extra: { scheduleId: schedule.id },
        schedule: { on: { hour, minute } },
      },
    ];
  }

  // weekly: JSのdaysOfWeek(0=日〜6=土)をCapacitorのweekday(1=日〜7=土)に変換
  return (schedule.recurrence.daysOfWeek ?? []).map((day) => ({
    id: baseId * 10 + day,
    title: TITLE,
    body: BODY,
    extra: { scheduleId: schedule.id },
    schedule: { on: { weekday: day + 1, hour, minute } },
  }));
}

export async function scheduleNativeSnooze(minutes: number): Promise<void> {
  const id = Math.floor(Date.now() % 1_000_000) + 1;
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: TITLE,
        body: "スヌーズしたチェックを再確認しましょう",
        schedule: { at: new Date(Date.now() + minutes * 60 * 1000) },
      },
    ],
  });
}

/**
 * 現在登録されているネイティブ通知をすべて取り消し、最新の予定一覧から再スケジュールする。
 * OS側がスケジュールを管理するため、アプリが完全に閉じていても発火する。
 */
export async function syncNativeSchedules(schedules: ScheduleEntry[]): Promise<void> {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  const notifications = schedules
    .filter((s) => s.notification.enabled)
    .flatMap(buildNotifications);
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}
