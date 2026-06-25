import { LocalNotifications } from "@capacitor/local-notifications";
import type { NotificationMode } from "../types";

const NORMAL_TITLE = "デルカク✓ の時間です";
const NORMAL_BODY = "出発前の忘れ物チェックをしましょう";
const STRONG_TITLE = "デルカク✓ まだ確認できていません";
const STRONG_BODY = "出発前の忘れ物チェックを済ませましょう";
const ALARM_TITLE = "デルカク✓ 確認をお願いします！";
const ALARM_BODY = "タップして今日の確認を完了してください";

const NORMAL_CHANNEL_ID = "derukaku-normal";
const ALERT_CHANNEL_ID = "derukaku-alert";

// 1段階目(通常)からの遅延(分)
const STAGE2_OFFSET_MIN = 5;
const STAGE3_OFFSET_MIN = 10;
// 3段階目(アラーム風)は短い間隔で繰り返し、止めるまで鳴り続ける感を近似する
const STAGE3_REPEAT_COUNT = 5;
const STAGE3_REPEAT_INTERVAL_SEC = 30;
// 何日先までスケジュールしておくか(アプリを開くたびに再計算されるので十分な余裕を持たせる)
const DAYS_AHEAD = 7;

/**
 * 1段階目の通常通知向けチャンネル。
 */
async function ensureNormalChannel(): Promise<void> {
  await LocalNotifications.createChannel({
    id: NORMAL_CHANNEL_ID,
    name: "デルカク通知",
    description: "出発前の確認をお知らせします",
    importance: 3,
  });
}

/**
 * 2・3段階目向け、振動＋しっかりした通知音で届く専用チャンネル。
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
  // allowWhileIdle がないと Android の setExact は Doze(画面オフ・放置)中に
  // 配信が遅延される。1段階目だけ気づかれて以降が鳴らない不具合の原因だったため必須。
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
 * 今日から DAYS_AHEAD 日分、3段階の通知(通常→強め→アラーム風の連続通知)を組み立てる。
 * todayCompleted が true の場合、今日(offset 0)分はすべて除外する
 * （「チェック完了後のものは強制完了とする」の実装）。
 * 過去の時刻になってしまうものはその日もスケジュールしない。
 */
function buildEscalationNotifications(
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

    const id = 1 + offset * 10;
    const stage1At = atTime(day, hour, minute);
    if (stage1At.getTime() > now) {
      notifications.push({
        id,
        title: NORMAL_TITLE,
        body: NORMAL_BODY,
        channelId: NORMAL_CHANNEL_ID,
        schedule: { at: stage1At, allowWhileIdle: true },
      });
    }

    const stage2At = atTime(day, hour, minute, STAGE2_OFFSET_MIN * 60);
    if (stage2At.getTime() > now) {
      notifications.push({
        id: id + 1,
        title: STRONG_TITLE,
        body: STRONG_BODY,
        channelId: ALERT_CHANNEL_ID,
        schedule: { at: stage2At, allowWhileIdle: true },
      });
    }

    for (let n = 0; n < STAGE3_REPEAT_COUNT; n++) {
      const stage3At = atTime(day, hour, minute, STAGE3_OFFSET_MIN * 60 + n * STAGE3_REPEAT_INTERVAL_SEC);
      if (stage3At.getTime() <= now) continue;
      notifications.push({
        id: id + 2 + n,
        title: ALARM_TITLE,
        body: ALARM_BODY,
        channelId: ALERT_CHANNEL_ID,
        schedule: { at: stage3At, allowWhileIdle: true },
      });
    }
  }

  return notifications;
}

/**
 * 現在登録されているネイティブ通知をすべて取り消し、最新の通知設定で再スケジュールする。
 * OS側がスケジュールを管理するため、アプリが完全に閉じていても発火する。
 * todayCompleted が true の間は、今日分の2・3段階目(および未発火の1段階目)は組み込まれない。
 */
export async function syncStandingNativeNotification(
  mode: NotificationMode,
  time: string,
  customDays: number[],
  todayCompleted: boolean,
): Promise<void> {
  await ensureNormalChannel();
  await ensureAlertChannel();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  const notifications = buildEscalationNotifications(mode, time, customDays, todayCompleted);
  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}
