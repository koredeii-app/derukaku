import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSettingsStore } from "../../store/settingsStore";
import {
  getExactAlarmPermission,
  getNotificationPermissionState,
  requestExactAlarmPermissionSetting,
  requestNotificationPermission,
} from "../../lib/notification";
import { resizeImageFileToDataUrl } from "../../lib/imageResize";
import type { FontSize, NotificationMode, NotificationPermissionState, ThemeColor } from "../../types";

const FONT_SIZE_LABELS: Record<FontSize, string> = {
  standard: "標準",
  large: "大",
  "extra-large": "特大",
};

const NOTIFICATION_MODE_LABELS: Record<NotificationMode, string> = {
  auto: "自動（平日のみ）",
  daily: "毎日",
  custom: "カスタム",
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const PERMISSION_LABELS: Record<string, string> = {
  granted: "許可済み",
  denied: "拒否されています（ブラウザの設定から変更してください）",
  default: "未設定",
};

const THEME_COLOR_OPTIONS: { value: ThemeColor; label: string; swatch: string }[] = [
  { value: "blue", label: "ブルー", swatch: "#2563eb" },
  { value: "green", label: "グリーン", swatch: "#16a34a" },
  { value: "purple", label: "パープル", swatch: "#7c3aed" },
  { value: "orange", label: "オレンジ", swatch: "#ea580c" },
  { value: "pink", label: "ピンク", swatch: "#db2777" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const themeColor = useSettingsStore((s) => s.themeColor);
  const notificationMode = useSettingsStore((s) => s.notificationMode);
  const notificationTime = useSettingsStore((s) => s.notificationTime);
  const notificationCustomDays = useSettingsStore((s) => s.notificationCustomDays);
  const notificationPermission = useSettingsStore((s) => s.notificationPermission);
  const homeBackgroundImage = useSettingsStore((s) => s.homeBackgroundImage);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const toggleCustomDay = (day: number) => {
    const next = notificationCustomDays.includes(day)
      ? notificationCustomDays.filter((d) => d !== day)
      : [...notificationCustomDays, day];
    updateSettings({ notificationCustomDays: next });
  };
  const [currentPermission, setCurrentPermission] = useState<NotificationPermissionState>(
    notificationPermission,
  );
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [exactAlarmGranted, setExactAlarmGranted] = useState(true);

  useEffect(() => {
    getNotificationPermissionState().then(setCurrentPermission);

    const refreshExactAlarm = () => {
      getExactAlarmPermission().then(setExactAlarmGranted);
    };
    refreshExactAlarm();
    document.addEventListener("visibilitychange", refreshExactAlarm);
    return () => document.removeEventListener("visibilitychange", refreshExactAlarm);
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setCurrentPermission(result);
    updateSettings({ notificationPermission: result });
  };

  const handleRequestExactAlarm = async () => {
    await requestExactAlarmPermissionSetting();
  };

  const handleBackgroundChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBackgroundError("画像ファイルを選択してください");
      return;
    }
    try {
      const dataUrl = await resizeImageFileToDataUrl(file);
      updateSettings({ homeBackgroundImage: dataUrl });
      setBackgroundError(null);
    } catch {
      setBackgroundError("画像の設定に失敗しました。別の画像でお試しください。");
    }
  };

  const handleReset = () => {
    if (!window.confirm("すべてのデータを削除します。この操作は取り消せません。よろしいですか？")) {
      return;
    }
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("derukaku:"))
      .forEach((key) => window.localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <div className="page">
      <PageHeader title="設定" />

      <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>文字サイズ</strong>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {(Object.keys(FONT_SIZE_LABELS) as FontSize[]).map((size) => (
            <button
              key={size}
              type="button"
              className="chip"
              data-selected={fontSize === size}
              onClick={() => updateSettings({ fontSize: size })}
            >
              {FONT_SIZE_LABELS[size]}
            </button>
          ))}
        </div>
      </div>

      <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>テーマカラー</strong>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {THEME_COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="theme-swatch"
              data-selected={themeColor === option.value}
              aria-label={option.label}
              style={{ background: option.swatch }}
              onClick={() => updateSettings({ themeColor: option.value })}
            />
          ))}
        </div>
      </div>

      <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>通知</strong>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {(Object.keys(NOTIFICATION_MODE_LABELS) as NotificationMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className="chip"
              data-selected={notificationMode === mode}
              onClick={() => updateSettings({ notificationMode: mode })}
            >
              {NOTIFICATION_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <label htmlFor="notification-time">通知時刻</label>
        <input
          id="notification-time"
          type="time"
          value={notificationTime}
          onChange={(e) => updateSettings({ notificationTime: e.target.value })}
        />
        {notificationMode === "custom" && (
          <>
            <label>通知する曜日</label>
            <div className="row" style={{ flexWrap: "wrap" }}>
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  className="chip"
                  data-selected={notificationCustomDays.includes(day)}
                  onClick={() => toggleCustomDay(day)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>特別な予定</strong>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          通院や旅行など、特定の日だけ確認したいセットはカレンダーから登録できます。
        </p>
        <Button variant="secondary" onClick={() => navigate("/calendar")}>
          カレンダーを開く
        </Button>
      </div>

      <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>ホーム画面の背景</strong>
        {homeBackgroundImage && (
          <img
            src={homeBackgroundImage}
            alt="ホーム画面の背景プレビュー"
            style={{
              width: "100%",
              maxHeight: 160,
              objectFit: "cover",
              borderRadius: "var(--radius-md)",
            }}
          />
        )}
        <label htmlFor="home-background-input" className="btn btn-secondary" style={{ textAlign: "center" }}>
          画像を選択
        </label>
        <input
          id="home-background-input"
          type="file"
          accept="image/*"
          onChange={handleBackgroundChange}
          style={{ display: "none" }}
        />
        {backgroundError && (
          <p style={{ margin: 0, color: "var(--color-danger)" }}>{backgroundError}</p>
        )}
        {homeBackgroundImage && (
          <Button variant="ghost" onClick={() => updateSettings({ homeBackgroundImage: undefined })}>
            背景を削除
          </Button>
        )}
      </div>

      <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>通知の許可状態</strong>
        <p style={{ margin: 0 }}>{PERMISSION_LABELS[currentPermission] ?? "不明"}</p>
        {notificationPermission !== "granted" && (
          <Button onClick={handleRequestPermission}>通知を許可する</Button>
        )}
      </div>

      {Capacitor.isNativePlatform() && !exactAlarmGranted && (
        <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
          <strong>通知のタイミングがずれる場合</strong>
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            「アラームとリマインダー」を許可すると、設定した時刻ちょうどに通知が届くようになります（未許可だと数分ずれることがあります）。
          </p>
          <Button onClick={handleRequestExactAlarm}>許可設定を開く</Button>
        </div>
      )}

      <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>データ</strong>
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          すべてのデータはこの端末内のみに保存され、外部には送信されません。
        </p>
        <Button variant="danger" onClick={handleReset}>
          すべてのデータを削除
        </Button>
      </div>
    </div>
  );
}
