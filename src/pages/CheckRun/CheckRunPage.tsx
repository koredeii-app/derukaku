import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useSessionsStore } from "../../store/sessionsStore";
import { useItemsStore } from "../../store/itemsStore";
import { useSetsStore } from "../../store/setsStore";
import { useSchedulesStore } from "../../store/schedulesStore";
import { useSettingsStore } from "../../store/settingsStore";
import { resolveScheduleItems } from "../../lib/dedupe";
import { scheduleSnooze } from "../../lib/notification";
import { toDateKey } from "../../lib/recurrence";

export default function CheckRunPage() {
  const navigate = useNavigate();
  const { scheduleId, sessionId } = useParams();

  const sessions = useSessionsStore((s) => s.sessions);
  const startSession = useSessionsStore((s) => s.startSession);
  const toggleItem = useSessionsStore((s) => s.toggleItem);
  const items = useItemsStore((s) => s.items);
  const sets = useSetsStore((s) => s.sets);
  const schedules = useSchedulesStore((s) => s.schedules);
  const defaultSnoozeMinutes = useSettingsStore((s) => s.defaultSnoozeMinutes);

  const [resolvedSessionId, setResolvedSessionId] = useState(sessionId);
  const [showSnooze, setShowSnooze] = useState(false);

  useEffect(() => {
    if (sessionId) {
      setResolvedSessionId(sessionId);
      return;
    }
    if (!scheduleId) return;
    const todayKey = toDateKey(new Date());
    const existing = sessions.find(
      (s) => s.scheduleEntryId === scheduleId && s.targetDate === todayKey && s.status === "in_progress",
    );
    if (existing) {
      setResolvedSessionId(existing.id);
      return;
    }
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const resolvedItems = resolveScheduleItems(schedule, sets, items);
    const session = startSession(resolvedItems.map((i) => i.id), scheduleId);
    setResolvedSessionId(session.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, sessionId]);

  const session = sessions.find((s) => s.id === resolvedSessionId);
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  useEffect(() => {
    if (session?.status === "completed") {
      navigate(`/check/session/${session.id}/complete`, { replace: true });
    }
  }, [session?.status, session?.id, navigate]);

  if (!session) {
    return (
      <div className="page">
        <div className="empty-state card">チェック対象が見つかりませんでした</div>
        <Button variant="secondary" onClick={() => navigate("/")}>
          ホームへ戻る
        </Button>
      </div>
    );
  }

  const handleSnooze = (minutes: number) => {
    scheduleSnooze(minutes);
    setShowSnooze(false);
    navigate("/");
  };

  return (
    <div className="page">
      <h1 className="page-title">出発前チェック</h1>
      <p className="page-subtitle">すべてタップしてチェックしてください</p>

      <div className="stack" style={{ marginBottom: "var(--space-5)" }}>
        {session.items.map((result) => {
          const item = itemsById.get(result.itemId);
          if (!item) return null;
          return (
            <button
              key={result.itemId}
              type="button"
              className="check-row"
              data-checked={result.checked}
              onClick={() => toggleItem(session.id, result.itemId)}
            >
              <span className="check-box">{result.checked ? "✓" : ""}</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      <Button variant="ghost" onClick={() => setShowSnooze(true)}>
        あとで（スヌーズ）
      </Button>

      {showSnooze && (
        <Modal onClose={() => setShowSnooze(false)}>
          <div className="stack">
            <h2 className="page-title">スヌーズ</h2>
            <p>何分後に再通知しますか？</p>
            {[5, 10, 15].map((minutes) => (
              <Button
                key={minutes}
                variant={minutes === defaultSnoozeMinutes ? "primary" : "secondary"}
                onClick={() => handleSnooze(minutes)}
              >
                {minutes}分後
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setShowSnooze(false)}>
              キャンセル
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
