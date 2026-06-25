import { LocalNotifications } from "@capacitor/local-notifications";
import type { NotificationMode } from "../types";

const TITLE = "デルカク✓ の時間です";
const BODY = "出発前の忘れ物チェックをしましょう";
const STANDING_BASE_ID = 1;
const ALERT_CHANNEL_ID = "derukaku-alert";

/**
 * 振動＋しっかりした通知音で届く専用チャンネルを用意する。
 * 既に存在する場合は何もしない（Android はチャンネル作成後の重要度変更を許さないため、
 * 一度作成したチャンネルの設定を変えるにはアプリのデータ削除が必要）。
 */
async function ensureAlertChannel(): Promise<void> {
  await LocalNotifications.createChannel({
    id: ALERT_CHANNEL_ID,
    name: "デルカク確認アラート",
    description: "出発前の確認を振動と通知音でお知らせします",
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true,
  });
}

export async function requestNativePermission(): Promise<boolean> {
  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

export async function getNativePermissionState(): Promise<boolean> {
  const result = await LocalNotifications.checkPermissions();
  return result.display === "granted";
}

/** 「正確なアラーム」許可状態を確認する（無いと数分単位でずれて発火する） */
export async function checkExactAlarmPermission(): Promise<boolean> {
  const result = await LocalNotifications.checkExactNotificationSetting();
  return result.exact_alarm === "granted";
}

/** OSの「アラームとリマインダー」許可設定画面を開く */
export async function requestExactAlarmPermission(): Promise<boolean> {
  const result = await LocalNotifications.changeExactNotificationSetting();
  return result.exact_alarm === "granted";
}

type PendingNotification = {
  id: number;
  title: string;
  body: string;
  channelId: string;
  schedule: { on: { weekday?: number; hour: number; minute: number } };
};

function buildStandingNotifications(
  mode: NotificationMode,
  time: string,
  customDays: number[],
): PendingNotification[] {
  const [hour, minute] = time.split(":").map(Number);

  if (mode === "daily") {
    return [
      {
        id: STANDING_BASE_ID,
        title: TITLE,
        body: BODY,
        channelId: ALERT_CHANNEL_ID,
        schedule: { on: { hour, minute } },
      },
    ];
  }

  // auto: 平日(月-金)のみ。weekday は Capacitor の仕様で 1=日〜7=土。
  const days = mode === "auto" ? [1, 2, 3, 4, 5] : customDays;
  return days.map((day) => ({
    id: STANDING_BASE_ID + day + 1,
    title: TITLE,
    body: BODY,
    channelId: ALERT_CHANNEL_ID,
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
  await ensureAlertChannel();
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
