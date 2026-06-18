import type { Recurrence } from "../types";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 指定日に recurrence が適用されるかどうかを判定する */
export function matchesDate(recurrence: Recurrence, date: Date): boolean {
  const dateKey = toDateKey(date);
  switch (recurrence.type) {
    case "once":
      return recurrence.date === dateKey;
    case "daily":
      return true;
    case "weekly":
      return (recurrence.daysOfWeek ?? []).includes(date.getDay());
    default:
      return false;
  }
}

/** 指定した月（year, monthIndex: 0-11）のうち recurrence が適用される日付一覧を返す */
export function expandRecurrenceInMonth(
  recurrence: Recurrence,
  year: number,
  monthIndex: number,
): Date[] {
  const result: Date[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    if (matchesDate(recurrence, date)) result.push(date);
  }
  return result;
}

export { toDateKey };
