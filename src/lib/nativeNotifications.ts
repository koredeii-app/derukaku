import { LocalNotifications } from "@capacitor/local-notifications";
import type { NotificationMode } from "../types";

const TITLE = "デルカク✓ の時間です";
const BODY = "出発前の忘れ物チェックをしましょう";

const ALERT_CHANNEL_ID = "derukaku-alert";

// 何日先までスケジュールしておくか(アプリを開くたびに再計算されるので十分な余裕を持たせる)
const DAYS_AHEAD = 7;

/**
 * 振動＋しっかりした通知音で届く専用チャンネル。
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
  // allowWhileIdle がないと Android の setExact は Doze(画面オフ・放置)中に配信が遅延される。
  schedule: { at: Date; allowWhileIdle: true };
};

function shouldFireOnDay(mode: NotificationMode, customDays: number[], day: number): boolean {
  if (mode === "daily") return true;
  if (mode === "auto") return day >= 1 && day <= 5;
  return customDays.includes(day);
}

function atTime(base: Date, hour: number, minute: number, extraSeconds = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return new Date(d.getTime() + extraSeconds * 1000);
}

/**
 * 今日から DAYS_AHEAD 日分の通知を組み立てる。
 * todayCompleted が true の場合、今日(offset 0)分は除外する(完了済みなら催促しない)。
 * 過去の時刻になってしまう日もスケジュールしない。
 */
function buildNotifications(
  mode: NotificationMode,
  time: string,
  customDays: number[],
  todayCompleted: boolean,
): PendingNotification[] {
  const [hour, minute] = time.split(":").map(Number);
  const now = Date.now();
  const notifications: PendingNotification[] = [];

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    if (offset === 0 && todayCompleted) continue;

    const day = new Date();
    day.setDate(day.getDate() + offset);
    if (!shouldFireOnDay(mode, customDays, day.getDay())) continue;

    const at = atTime(day, hour, minute);
    if (at.getTime() <= now) continue;

    notifications.push({
      id: 1 + offset,
      title: TITLE,
      body: BODY,
      channelId: ALERT_CHANNEL_ID,
      schedule: { at, allowWhileIdle: true },
    });
  }

  return notifications;
}

/**
 * 現在登録されているネイティブ通知をすべて取り消し、最新の通知設定で再スケジュールする。
 * OS側がスケジュールを管理するため、アプリが完全に閉じていても発火する。
 * todayCompleted が true の間は、今日分の通知は組み込まれない。
 */
export async function syncStandingNativeNotification(
  mode: NotificationMode,
  time: string,
  customDays: number[],
  todayCompleted: boolean,
): Promise<void> {
  await ensureAlertChannel();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  const notifications = buildNotifications(mode, time, customDays, todayCompleted);
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}
