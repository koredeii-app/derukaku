import { useItemsStore } from "../store/itemsStore";
import { useSetsStore } from "../store/setsStore";

const DEFAULT_SET_DEFINITIONS = [
  { name: "仕事セット", itemNames: ["財布", "スマホ", "鍵", "社員証"] },
  { name: "医療セット", itemNames: ["財布", "スマホ", "鍵", "保険証", "お薬"] },
  { name: "レジャーセット", itemNames: ["財布", "スマホ", "鍵", "カメラ", "日焼け止め"] },
];

/** 初回起動時のみ、仕事／医療／レジャーのデフォルトセットと項目を投入する */
export function seedDefaultsIfEmpty(): void {
  const itemsStore = useItemsStore.getState();
  const setsStore = useSetsStore.getState();
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
    setsStore.addSet(def.name, itemIds);
  }
}
