import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useItemsStore } from "../../store/itemsStore";
import { useSetsStore } from "../../store/setsStore";
import { useSchedulesStore } from "../../store/schedulesStore";
import type { Item } from "../../types";

export default function ItemsPage() {
  const items = useItemsStore((s) => s.items);
  const addItem = useItemsStore((s) => s.addItem);
  const updateItem = useItemsStore((s) => s.updateItem);
  const removeItem = useItemsStore((s) => s.removeItem);
  const removeItemRefFromSets = useSetsStore((s) => s.removeItemReference);
  const removeItemRefFromSchedules = useSchedulesStore((s) => s.removeItemReference);

  const [editing, setEditing] = useState<Item | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");

  const openCreate = () => {
    setName("");
    setIsCreating(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setName(item.name);
  };

  const close = () => {
    setIsCreating(false);
    setEditing(null);
    setName("");
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      updateItem(editing.id, { name: trimmed });
    } else {
      addItem(trimmed);
    }
    close();
  };

  const handleDelete = (item: Item) => {
    removeItem(item.id);
    removeItemRefFromSets(item.id);
    removeItemRefFromSchedules(item.id);
    close();
  };

  return (
    <div className="page">
      <PageHeader title="チェック項目" subtitle="忘れ物チェックの対象になるものを登録します" />

      <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
        {items.length === 0 && <div className="empty-state card">まだ項目がありません</div>}
        {items.map((item) => (
          <div key={item.id} className="list-item">
            <span className="name">{item.name}</span>
            <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
              編集
            </Button>
          </div>
        ))}
      </div>

      <Button onClick={openCreate}>＋ 項目を追加</Button>

      {(isCreating || editing) && (
        <Modal onClose={close}>
          <div className="stack">
            <h2 className="page-title">{editing ? "項目を編集" : "項目を追加"}</h2>
            <label htmlFor="item-name">項目名</label>
            <input
              id="item-name"
              type="text"
              value={name}
              autoFocus
              placeholder="例: 財布"
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={save}>保存</Button>
            {editing && (
              <Button variant="danger" onClick={() => handleDelete(editing)}>
                削除
              </Button>
            )}
            <Button variant="ghost" onClick={close}>
              キャンセル
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
