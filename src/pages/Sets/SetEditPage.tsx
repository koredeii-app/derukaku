import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { useSchedulesStore } from "../../store/schedulesStore";

export default function SetEditPage() {
  const navigate = useNavigate();
  const { setId } = useParams();
  const sets = useSetsStore((s) => s.sets);
  const addSet = useSetsStore((s) => s.addSet);
  const updateSet = useSetsStore((s) => s.updateSet);
  const removeSet = useSetsStore((s) => s.removeSet);
  const removeSetRefFromSchedules = useSchedulesStore((s) => s.removeSetReference);
  const items = useItemsStore((s) => s.items);

  const existing = setId ? sets.find((s) => s.id === setId) : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(existing?.itemIds ?? []);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existing) {
      updateSet(existing.id, { name: trimmed, itemIds: selectedIds });
    } else {
      addSet(trimmed, selectedIds);
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

      <div className="stack" style={{ marginBottom: "var(--space-5)" }}>
        <label>含める項目</label>
        {items.length === 0 && (
          <div className="empty-state card">先に「項目」からチェック項目を登録してください</div>
        )}
        <div className="row" style={{ flexWrap: "wrap" }}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              data-selected={selectedIds.includes(item.id)}
              onClick={() => toggleItem(item.id)}
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
            このセットを削除
          </Button>
        )}
      </div>
    </div>
  );
}
