import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSettingsStore } from "../../store/settingsStore";
import { getNotificationPermissionState, requestNotificationPermission } from "../../lib/notification";
import { resizeImageFileToDataUrl } from "../../lib/imageResize";
import type { FontSize, NotificationPermissionState } from "../../types";

const FONT_SIZE_LABELS: Record<FontSize, string> = {
  standard: "標準",
  large: "大",
  "extra-large": "特大",
};

const PERMISSION_LABELS: Record<string, string> = {
  granted: "許可済み",
  denied: "拒否されています（ブラウザの設定から変更してください）",
  default: "未設定",
};

export default function SettingsPage() {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const defaultSnoozeMinutes = useSettingsStore((s) => s.defaultSnoozeMinutes);
  const notificationPermission = useSettingsStore((s) => s.notificationPermission);
  const homeBackgroundImage = useSettingsStore((s) => s.homeBackgroundImage);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [currentPermission, setCurrentPermission] = useState<NotificationPermissionState>(
    notificationPermission,
  );
  const [backgroundError, setBackgroundError] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPermissionState().then(setCurrentPermission);
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setCurrentPermission(result);
    updateSettings({ notificationPermission: result });
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
        <strong>デフォルトのスヌーズ時間</strong>
        <div className="row">
          {[5, 10, 15].map((minutes) => (
            <button
              key={minutes}
              type="button"
              className="chip"
              data-selected={defaultSnoozeMinutes === minutes}
              onClick={() => updateSettings({ defaultSnoozeMinutes: minutes })}
            >
              {minutes}分
            </button>
          ))}
        </div>
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
