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

  const LONG_PRESS_MS = 350;
  const MOVE_CANCEL_PX = 8;

  const [dragOrder, setDragOrder] = useState<Item[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const longPressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const displayItems = dragOrder ?? items;

  const clearLongPressTimer = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const moveDragTo = (pointerY: number) => {
    const draggingItemId = draggingIdRef.current;
    if (!draggingItemId) return;
    setDragOrder((current) => {
      if (!current) return current;
      const currentIndex = current.findIndex((item) => item.id === draggingItemId);
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

  const handleRowPointerDown = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    pressStart.current = { x: e.clientX, y: e.clientY };
    const rowEl = e.currentTarget;
    const pointerId = e.pointerId;
    clearLongPressTimer();
    longPressTimer.current = window.setTimeout(() => {
      draggingIdRef.current = id;
      setDragOrder(items);
      setDraggingId(id);
      rowEl.setPointerCapture(pointerId);
    }, LONG_PRESS_MS);
  };

  const handleRowPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingIdRef.current) {
      moveDragTo(e.clientY);
      return;
    }
    if (!pressStart.current) return;
    const dx = Math.abs(e.clientX - pressStart.current.x);
    const dy = Math.abs(e.clientY - pressStart.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      clearLongPressTimer();
    }
  };

  const handleRowPointerUp = () => {
    clearLongPressTimer();
    pressStart.current = null;
    if (draggingIdRef.current) {
      setDragOrder((current) => {
        if (current) reorderItems(current.map((item) => item.id));
        return null;
      });
      draggingIdRef.current = null;
      setDraggingId(null);
    }
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
            onPointerDown={(e) => handleRowPointerDown(e, item.id)}
            onPointerMove={handleRowPointerMove}
            onPointerUp={handleRowPointerUp}
            onPointerCancel={handleRowPointerUp}
          >
            <span className="name">{item.name}</span>
            <Button
              size="sm"
              variant="secondary"
              data-no-drag
              onClick={() => openEdit(item)}
            >
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
