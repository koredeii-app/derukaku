import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSchedulesStore } from "../../store/schedulesStore";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { matchesDate, toDateKey } from "../../lib/recurrence";
import { resolveScheduleItems } from "../../lib/dedupe";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const navigate = useNavigate();
  const schedules = useSchedulesStore((s) => s.schedules);
  const sets = useSetsStore((s) => s.sets);
  const items = useItemsStore((s) => s.items);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstDayOfMonth.getDay();

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  const schedulesForDate = (date: Date) =>
    schedules.filter((s) => matchesDate(s.recurrence, date));

  const changeMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selectedSchedules = schedulesForDate(selectedDate);

  return (
    <div className="page">
      <PageHeader title="カレンダー" subtitle="予定（セット・項目）を日付に登録します" />

      <div className="row" style={{ marginBottom: "var(--space-3)" }}>
        <Button size="sm" variant="secondary" onClick={() => changeMonth(-1)}>
          ＜
        </Button>
        <strong style={{ flex: 1, textAlign: "center" }}>
          {viewYear}年{viewMonth + 1}月
        </strong>
        <Button size="sm" variant="secondary" onClick={() => changeMonth(1)}>
          ＞
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
          marginBottom: "var(--space-4)",
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
            {label}
          </div>
        ))}
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const isSelected = toDateKey(date) === toDateKey(selectedDate);
          const isToday = toDateKey(date) === toDateKey(today);
          const hasSchedule = schedulesForDate(date).length > 0;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDate(date)}
              style={{
                minHeight: 44,
                borderRadius: 10,
                border: isToday ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                background: isSelected ? "var(--color-primary)" : "var(--color-bg)",
                color: isSelected ? "#fff" : "var(--color-text)",
                cursor: "pointer",
                position: "relative",
                fontWeight: 600,
              }}
            >
              {date.getDate()}
              {hasSchedule && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: isSelected ? "#fff" : "var(--color-primary)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
        <strong>
          {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の予定
        </strong>
        {selectedSchedules.length === 0 && (
          <div className="empty-state card">この日の予定はありません</div>
        )}
        {selectedSchedules.map((schedule) => {
          const resolved = resolveScheduleItems(schedule, sets, items);
          return (
            <button
              key={schedule.id}
              type="button"
              className="list-item"
              style={{ cursor: "pointer", textAlign: "left" }}
              onClick={() => navigate(`/calendar/${schedule.id}/edit`)}
            >
              <span className="name">
                {resolved.map((i) => i.name).join(" / ") || "項目未設定"}（{schedule.notification.time}）
              </span>
            </button>
          );
        })}
      </div>

      <Button onClick={() => navigate(`/calendar/new?date=${toDateKey(selectedDate)}`)}>
        ＋ この日に予定を追加
      </Button>
    </div>
  );
}
