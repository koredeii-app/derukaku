import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { useSchedulesStore } from "../../store/schedulesStore";
import type { Item } from "../../types";

export default function SetEditPage() {
  const navigate = useNavigate();
  const { setId } = useParams();
  const sets = useSetsStore((s) => s.sets);
  const addSet = useSetsStore((s) => s.addSet);
  const updateSet = useSetsStore((s) => s.updateSet);
  const removeSet = useSetsStore((s) => s.removeSet);
  const schedules = useSchedulesStore((s) => s.schedules);
  const addSchedule = useSchedulesStore((s) => s.addSchedule);
  const updateSchedule = useSchedulesStore((s) => s.updateSchedule);
  const removeSchedule = useSchedulesStore((s) => s.removeSchedule);
  const removeSetRefFromSchedules = useSchedulesStore((s) => s.removeSetReference);
  const removeItemRefFromSets = useSetsStore((s) => s.removeItemReference);
  const removeItemRefFromSchedules = useSchedulesStore((s) => s.removeItemReference);
  const items = useItemsStore((s) => s.items);
  const addItem = useItemsStore((s) => s.addItem);
  const removeItem = useItemsStore((s) => s.removeItem);

  const existing = setId ? sets.find((s) => s.id === setId) : undefined;
  const dailySchedule = existing
    ? schedules.find((s) => s.recurrence.type === "daily" && s.setIds.includes(existing.id))
    : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(existing?.itemIds ?? []);
  const [newItemName, setNewItemName] = useState("");
  const [alwaysActive, setAlwaysActive] = useState(Boolean(dailySchedule));

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const createItem = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    const item = addItem(trimmed);
    setSelectedIds((prev) => [...prev, item.id]);
    setNewItemName("");
  };

  const handleDeleteItem = (item: Item) => {
    if (!window.confirm(`「${item.name}」を完全に削除します。すべてのセットから削除されますがよろしいですか？`)) {
      return;
    }
    removeItem(item.id);
    removeItemRefFromSets(item.id);
    removeItemRefFromSchedules(item.id);
    setSelectedIds((prev) => prev.filter((id) => id !== item.id));
  };

  const syncDailySchedule = (setIdToSync: string) => {
    const current = schedules.find(
      (s) => s.recurrence.type === "daily" && s.setIds.includes(setIdToSync),
    );
    if (alwaysActive && !current) {
      addSchedule({ recurrence: { type: "daily" }, setIds: [setIdToSync], itemIds: [] });
    } else if (!alwaysActive && current) {
      if (current.setIds.length === 1) {
        removeSchedule(current.id);
      } else {
        updateSchedule(current.id, { setIds: current.setIds.filter((id) => id !== setIdToSync) });
      }
    }
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existing) {
      updateSet(existing.id, { name: trimmed, itemIds: selectedIds });
      syncDailySchedule(existing.id);
    } else {
      const created = addSet(trimmed, selectedIds);
      syncDailySchedule(created.id);
    }
    navigate("/sets");
  };

  const handleDelete = () => {
    if (!existing) return;
    removeSet(existing.id);
    removeSetRefFromSchedules(existing.id);
    navigate("/sets");
  };

  return (
    <div className="page">
      <PageHeader title={existing ? "セットを編集" : "セットを追加"} showBack />

      <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
        <label htmlFor="set-name">セット名</label>
        <input
          id="set-name"
          type="text"
          value={name}
          placeholder="例: 仕事セット"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
        <label>毎日の確認に含める</label>
        <button
          type="button"
          className="chip"
          data-selected={alwaysActive}
          onClick={() => setAlwaysActive((prev) => !prev)}
        >
          毎日表示する{alwaysActive ? "（ON）" : "（OFF）"}
        </button>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
          OFFのままだとこのセットは「今日の確認」に出てきません。通院や旅行など特定の日だけ出したい場合はカレンダーから予定として登録してください。
        </p>
      </div>

      <div className="stack" style={{ marginBottom: "var(--space-5)" }}>
        <label>含める項目</label>
        {items.length === 0 && <div className="empty-state card">まだ項目がありません</div>}
        <div className="row" style={{ flexWrap: "wrap" }}>
          {items.map((item) => (
            <span key={item.id} className="chip-group">
              <button
                type="button"
                className="chip"
                data-selected={selectedIds.includes(item.id)}
                onClick={() => toggleItem(item.id)}
              >
                {item.name}
              </button>
              <button
                type="button"
                className="chip-delete"
                aria-label={`${item.name}を削除`}
                onClick={() => handleDeleteItem(item)}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="row">
          <input
            type="text"
            style={{ flex: 1 }}
            value={newItemName}
            placeholder="新しい項目名（例: 保険証）"
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createItem();
            }}
          />
          <Button size="sm" variant="secondary" style={{ flexShrink: 0 }} onClick={createItem}>
            追加
          </Button>
        </div>
      </div>

      <div className="stack">
        <Button onClick={save}>保存</Button>
        {existing && (
          <Button variant="danger" onClick={handleDelete}>
            このセットを削除
          </Button>
        )}
      </div>
    </div>
  );
}
