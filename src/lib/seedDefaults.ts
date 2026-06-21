import { useItemsStore } from "../store/itemsStore";
import { useSetsStore } from "../store/setsStore";
import { useSchedulesStore } from "../store/schedulesStore";

const DEFAULT_SET_DEFINITIONS = [
  { name: "毎日", itemNames: ["スマホ", "財布", "鍵", "定期"], alwaysActive: true },
  { name: "通院", itemNames: ["マイナンバーカード", "保険証", "診察券", "お薬手帳"], alwaysActive: false },
  { name: "買い物", itemNames: ["財布", "エコバッグ"], alwaysActive: false },
  { name: "旅行", itemNames: ["財布", "充電器", "チケット"], alwaysActive: false },
];

/** 初回起動時のみ、毎日／通院／買い物／旅行のデフォルトセットと項目を投入する */
export function seedDefaultsIfEmpty(): void {
  const itemsStore = useItemsStore.getState();
  const setsStore = useSetsStore.getState();
  const schedulesStore = useSchedulesStore.getState();
  if (itemsStore.items.length > 0 || setsStore.sets.length > 0) return;

  const itemIdByName = new Map<string, string>();
  const ensureItem = (name: string): string => {
    const existing = itemIdByName.get(name);
    if (existing) return existing;
    const item = itemsStore.addItem(name);
    itemIdByName.set(name, item.id);
    return item.id;
  };

  for (const def of DEFAULT_SET_DEFINITIONS) {
    const itemIds = def.itemNames.map(ensureItem);
    const itemSet = setsStore.addSet(def.name, itemIds);
    if (def.alwaysActive) {
      schedulesStore.addSchedule({
        recurrence: { type: "daily" },
        setIds: [itemSet.id],
        itemIds: [],
      });
    }
  }
}
