import type { Item, ItemSet, ScheduleEntry } from "../types";

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
