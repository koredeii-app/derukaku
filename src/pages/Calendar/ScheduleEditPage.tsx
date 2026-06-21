import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSchedulesStore } from "../../store/schedulesStore";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { toDateKey } from "../../lib/recurrence";
import type { RecurrenceType } from "../../types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function ScheduleEditPage() {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const presetDate = searchParams.get("date") ?? toDateKey(new Date());

  const schedules = useSchedulesStore((s) => s.schedules);
  const addSchedule = useSchedulesStore((s) => s.addSchedule);
  const updateSchedule = useSchedulesStore((s) => s.updateSchedule);
  const removeSchedule = useSchedulesStore((s) => s.removeSchedule);
  const sets = useSetsStore((s) => s.sets);
  const items = useItemsStore((s) => s.items);

  const existing = scheduleId ? schedules.find((s) => s.id === scheduleId) : undefined;

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    existing?.recurrence.type ?? "once",
  );
  const [date, setDate] = useState(existing?.recurrence.date ?? presetDate);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existing?.recurrence.daysOfWeek ?? []);
  const [setIds, setSetIds] = useState<string[]>(existing?.setIds ?? []);
  const [itemIds, setItemIds] = useState<string[]>(existing?.itemIds ?? []);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const toggleSet = (id: string) => {
    setSetIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const toggleItemId = (id: string) => {
    setItemIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const save = () => {
    if (setIds.length === 0 && itemIds.length === 0) return;
    const payload = {
      recurrence:
        recurrenceType === "once"
          ? { type: "once" as const, date }
          : recurrenceType === "weekly"
            ? { type: "weekly" as const, daysOfWeek }
            : { type: "daily" as const },
      setIds,
      itemIds,
    };
    if (existing) {
      updateSchedule(existing.id, payload);
    } else {
      addSchedule(payload);
    }
    navigate("/calendar");
  };

  const handleDelete = () => {
    if (!existing) return;
    removeSchedule(existing.id);
    navigate("/calendar");
  };

  return (
    <div className="page">
      <PageHeader title={existing ? "予定を編集" : "予定を追加"} showBack />

      <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
        <label>繰り返し</label>
        <div className="row">
          {(["once", "weekly", "daily"] as RecurrenceType[]).map((type) => (
            <button
              key={type}
              type="button"
              className="chip"
              data-selected={recurrenceType === type}
              onClick={() => setRecurrenceType(type)}
            >
              {type === "once" ? "日付指定" : type === "weekly" ? "曜日指定" : "毎日"}
            </button>
          ))}
        </div>
      </div>

      {recurrenceType === "once" && (
        <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
          <label htmlFor="schedule-date">日付</label>
          <input
            id="schedule-date"
            type="text"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      )}

      {recurrenceType === "weekly" && (
        <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
          <label>曜日</label>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                className="chip"
                data-selected={daysOfWeek.includes(day)}
                onClick={() => toggleDay(day)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
        <label>この日に追加するセット</label>
        {sets.length === 0 && <div className="empty-state card">セットがまだありません</div>}
        <div className="row" style={{ flexWrap: "wrap" }}>
          {sets.map((set) => (
            <button
              key={set.id}
              type="button"
              className="chip"
              data-selected={setIds.includes(set.id)}
              onClick={() => toggleSet(set.id)}
            >
              {set.name}
            </button>
          ))}
        </div>
      </div>

      <div className="stack" style={{ marginBottom: "var(--space-5)" }}>
        <label>個別の項目（セットに含まれないもの）</label>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              data-selected={itemIds.includes(item.id)}
              onClick={() => toggleItemId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="stack">
        <Button onClick={save}>保存</Button>
        {existing && (
          <Button variant="danger" onClick={handleDelete}>
            この予定を削除
          </Button>
        )}
      </div>
    </div>
  );
}
