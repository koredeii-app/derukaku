import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { useSchedulesStore } from "../../store/schedulesStore";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { useSessionsStore } from "../../store/sessionsStore";
import { useSettingsStore } from "../../store/settingsStore";
import { matchesDate, toDateKey } from "../../lib/recurrence";
import { resolveScheduleItems } from "../../lib/dedupe";

export default function HomePage() {
  const navigate = useNavigate();
  const schedules = useSchedulesStore((s) => s.schedules);
  const sets = useSetsStore((s) => s.sets);
  const items = useItemsStore((s) => s.items);
  const sessions = useSessionsStore((s) => s.sessions);
  const startSession = useSessionsStore((s) => s.startSession);
  const homeBackgroundImage = useSettingsStore((s) => s.homeBackgroundImage);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const todaySchedules = useMemo(
    () => schedules.filter((s) => matchesDate(s.recurrence, today)),
    [schedules, today],
  );

  const inProgressSession = sessions.find(
    (s) => s.targetDate === todayKey && s.status === "in_progress",
  );

  const todayCompletedScheduleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const session of sessions) {
      if (session.targetDate === todayKey && session.status === "completed" && session.scheduleEntryId) {
        ids.add(session.scheduleEntryId);
      }
    }
    return ids;
  }, [sessions, todayKey]);

  const [expandedScheduleIds, setExpandedScheduleIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (scheduleId: string) => {
    setExpandedScheduleIds((prev) => {
      const next = new Set(prev);
      if (next.has(scheduleId)) next.delete(scheduleId);
      else next.add(scheduleId);
      return next;
    });
  };

  const handleStart = (scheduleId: string | undefined, resolvedItemIds: string[]) => {
    if (resolvedItemIds.length === 0) return;
    const session = startSession(resolvedItemIds, scheduleId);
    navigate(`/check/session/${session.id}`);
  };

  return (
    <div
      className={`page${homeBackgroundImage ? " page-bg-image" : ""}`}
      style={homeBackgroundImage ? { backgroundImage: `url(${homeBackgroundImage})` } : undefined}
    >
      <h1 className="page-title">今日の予定</h1>
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
        {todaySchedules.length === 0 && (
          <div className="empty-state card">本日の予定はありません</div>
        )}
        {todaySchedules.map((schedule) => {
          const resolved = resolveScheduleItems(schedule, sets, items);
          const label = resolved.map((i) => i.name).join(" / ") || "項目未設定";
          const isCompleted = todayCompletedScheduleIds.has(schedule.id);
          const isExpanded = expandedScheduleIds.has(schedule.id);

          if (isCompleted && !isExpanded) {
            return (
              <button
                key={schedule.id}
                type="button"
                className="schedule-chip-done"
                onClick={() => toggleExpanded(schedule.id)}
              >
                ✓ {label}
              </button>
            );
          }

          return (
            <div key={schedule.id} className="card stack">
              <div className="row">
                <strong>{label}</strong>
                <span className="spacer" />
                <span style={{ color: "var(--color-text-muted)" }}>
                  {schedule.notification.time}
                </span>
              </div>
              {isCompleted ? (
                <Button variant="ghost" onClick={() => toggleExpanded(schedule.id)}>
                  ✓ チェック済み（タップで折りたたむ）
                </Button>
              ) : (
                <Button onClick={() => handleStart(schedule.id, resolved.map((i) => i.id))}>
                  チェック開始
                </Button>
              )}
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
