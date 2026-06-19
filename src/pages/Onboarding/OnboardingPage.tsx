import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { useSettingsStore } from "../../store/settingsStore";
import { requestNotificationPermission } from "../../lib/notification";
import { seedDefaultsIfEmpty } from "../../lib/seedDefaults";

const SLIDES = [
  {
    title: "デルカク✓",
    body: "出発前の「最終確認」で忘れ物を防止するアプリです。",
  },
  {
    title: "セットを登録",
    body: "仕事・通院・お出かけなど、よく使う持ち物の組み合わせをセットとして登録できます。",
  },
  {
    title: "通知でお知らせ",
    body: "出発前の時刻に通知が届きます。タップしてチェックするだけで完了です。",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;

  const finish = async () => {
    seedDefaultsIfEmpty();
    const result = await requestNotificationPermission();
    updateSettings({ onboardingCompleted: true, notificationPermission: result });
    navigate("/");
  };

  const slide = SLIDES[step];

  return (
    <div className="page" style={{ justifyContent: "center", textAlign: "center" }}>
      <h1 className="page-title">{slide.title}</h1>
      <p className="page-subtitle">{slide.body}</p>

      <div className="row" style={{ justifyContent: "center", margin: "var(--space-5) 0" }}>
        {SLIDES.map((_, i) => (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              margin: "0 4px",
              background: i === step ? "var(--color-primary)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {isLast ? (
        <Button onClick={finish}>はじめる（通知を許可する）</Button>
      ) : (
        <Button onClick={() => setStep((s) => s + 1)}>次へ</Button>
      )}
    </div>
  );
}
