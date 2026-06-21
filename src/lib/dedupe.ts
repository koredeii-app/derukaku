import type { Item, ItemSet, ScheduleEntry } from "../types";
import { matchesDate } from "./recurrence";

/**
 * セット経由・個別追加分の項目をまとめ、重複を排除した Item 配列を返す。
 * 表示直前に計算する純粋関数（保存データは変更しない）。
 */
export function resolveScheduleItems(
  schedule: Pick<ScheduleEntry, "setIds" | "itemIds">,
  sets: ItemSet[],
  items: Item[],
): Item[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const setsById = new Map(sets.map((set) => [set.id, set]));

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  const addId = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
  };

  for (const setId of schedule.setIds) {
    const set = setsById.get(setId);
    if (!set) continue;
    for (const itemId of set.itemIds) addId(itemId);
  }
  for (const itemId of schedule.itemIds) addId(itemId);

  return orderedIds
    .map((id) => itemsById.get(id))
    .filter((item): item is Item => item !== undefined);
}

export interface TodayItem {
  item: Item;
  setIds: string[];
}

/**
 * 指定日に有効な全スケジュールを集約し、重複排除した項目一覧を返す。
 * setIds はその項目を含む「今日有効なセット」のID一覧（スワイプ除外の対象特定に使う）。
 */
export function resolveTodayItems(
  schedules: ScheduleEntry[],
  sets: ItemSet[],
  items: Item[],
  today: Date,
): TodayItem[] {
  const todaySchedules = schedules.filter((s) => matchesDate(s.recurrence, today));
  const setsById = new Map(sets.map((set) => [set.id, set]));

  const orderedIds: string[] = [];
  const setIdsByItemId = new Map<string, Set<string>>();

  const addSetIdForItem = (itemId: string, setId: string | undefined) => {
    if (!orderedIds.includes(itemId)) orderedIds.push(itemId);
    if (!setId) return;
    const existing = setIdsByItemId.get(itemId) ?? new Set<string>();
    existing.add(setId);
    setIdsByItemId.set(itemId, existing);
  };

  for (const schedule of todaySchedules) {
    for (const setId of schedule.setIds) {
      const itemSet = setsById.get(setId);
      if (!itemSet) continue;
      for (const itemId of itemSet.itemIds) addSetIdForItem(itemId, setId);
    }
    for (const itemId of schedule.itemIds) addSetIdForItem(itemId, undefined);
  }

  const itemsById = new Map(items.map((item) => [item.id, item]));
  return orderedIds
    .map((id) => {
      const item = itemsById.get(id);
      if (!item) return null;
      return { item, setIds: [...(setIdsByItemId.get(id) ?? [])] };
    })
    .filter((entry): entry is TodayItem => entry !== null);
}
