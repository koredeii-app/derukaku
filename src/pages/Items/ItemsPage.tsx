import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
  const reorderItems = useItemsStore((s) => s.reorderItems);
  const removeItemRefFromSets = useSetsStore((s) => s.removeItemReference);
  const removeItemRefFromSchedules = useSchedulesStore((s) => s.removeItemReference);

  const [editing, setEditing] = useState<Item | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");

  const [dragOrder, setDragOrder] = useState<Item[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const displayItems = dragOrder ?? items;

  const handleDragStart = (e: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    setDragOrder(items);
    setDraggingId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingId) return;
    const pointerY = e.clientY;
    setDragOrder((current) => {
      if (!current) return current;
      const currentIndex = current.findIndex((item) => item.id === draggingId);
      if (currentIndex === -1) return current;
      let targetIndex = current.length - 1;
      for (let i = 0; i < current.length; i++) {
        const el = itemRefs.current.get(current[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (pointerY < rect.top + rect.height / 2) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === currentIndex) return current;
      const next = [...current];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleDragEnd = () => {
    if (dragOrder) {
      reorderItems(dragOrder.map((item) => item.id));
    }
    setDraggingId(null);
    setDragOrder(null);
  };

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
        {displayItems.map((item) => (
          <div
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el);
              else itemRefs.current.delete(item.id);
            }}
            className={`list-item${draggingId === item.id ? " dragging" : ""}`}
          >
            <button
              type="button"
              className="drag-handle"
              aria-label="ドラッグして並び替え"
              onPointerDown={(e) => handleDragStart(e, item.id)}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
            >
              ⠿
            </button>
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
