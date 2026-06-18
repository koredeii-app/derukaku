import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { useSchedulesStore } from "../../store/schedulesStore";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { useSessionsStore } from "../../store/sessionsStore";
import { matchesDate, toDateKey } from "../../lib/recurrence";
import { resolveScheduleItems } from "../../lib/dedupe";

export default function HomePage() {
  const navigate = useNavigate();
  const schedules = useSchedulesStore((s) => s.schedules);
  const sets = useSetsStore((s) => s.sets);
  const items = useItemsStore((s) => s.items);
  const sessions = useSessionsStore((s) => s.sessions);
  const startSession = useSessionsStore((s) => s.startSession);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const todaySchedules = useMemo(
    () => schedules.filter((s) => matchesDate(s.recurrence, today)),
    [schedules, today],
  );

  const inProgressSession = sessions.find(
    (s) => s.targetDate === todayKey && s.status === "in_progress",
  );

  const handleStart = (scheduleId: string | undefined, resolvedItemIds: string[]) => {
    if (resolvedItemIds.length === 0) return;
    const session = startSession(resolvedItemIds, scheduleId);
    navigate(`/check/session/${session.id}`);
  };

  return (
    <div className="page">
      <h1 className="page-title">デルカク✓</h1>
      <p className="page-subtitle">出発前の忘れ物チェック</p>

      {inProgressSession && (
        <div className="card stack" style={{ marginBottom: "var(--space-4)" }}>
          <strong>本日の未完了チェックがあります</strong>
          <Button onClick={() => navigate(`/check/session/${inProgressSession.id}`)}>
            続きを確認する
          </Button>
        </div>
      )}

      <div className="stack" style={{ marginBottom: "var(--space-5)" }}>
        <h2 style={{ fontSize: "1.1rem" }}>今日の予定</h2>
        {todaySchedules.length === 0 && (
          <div className="empty-state card">本日の予定はありません</div>
        )}
        {todaySchedules.map((schedule) => {
          const resolved = resolveScheduleItems(schedule, sets, items);
          return (
            <div key={schedule.id} className="card stack">
              <div className="row">
                <strong>{resolved.map((i) => i.name).join(" / ") || "項目未設定"}</strong>
                <span className="spacer" />
                <span style={{ color: "var(--color-text-muted)" }}>
                  {schedule.notification.time}
                </span>
              </div>
              <Button onClick={() => handleStart(schedule.id, resolved.map((i) => i.id))}>
                チェック開始
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        variant="secondary"
        onClick={() => handleStart(undefined, items.map((i) => i.id))}
        disabled={items.length === 0}
      >
        今すぐチェックを始める（全項目）
      </Button>
    </div>
  );
}
