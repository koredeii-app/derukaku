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

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const longPressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  // rows have touch-action: none (see components.css) so a press-and-hold never
  // starts a native scroll. While the long-press hasn't fired yet, movement past
  // MOVE_CANCEL_PX means the user wanted to scroll, not drag, so we scroll
  // manually with this delta tracker since the browser won't do it for us.
  const isScrollingRef = useRef(false);
  const lastScrollYRef = useRef(0);

  const clearLongPressTimer = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const endDrag = (pointerY: number | null) => {
    const id = draggingIdRef.current;
    if (id && pointerY !== null) {
      const currentIndex = items.findIndex((item) => item.id === id);
      let targetIndex = items.length - 1;
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) continue;
        const el = itemRefs.current.get(items[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (pointerY < rect.top + rect.height / 2) {
          targetIndex = i;
          break;
        }
      }
      if (currentIndex !== -1 && targetIndex !== currentIndex) {
        const next = [...items];
        const [moved] = next.splice(currentIndex, 1);
        const adjustedTarget = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
        next.splice(adjustedTarget, 0, moved);
        reorderItems(next.map((item) => item.id));
      }
    }
    draggingIdRef.current = null;
    setDraggingId(null);
    setDragOffsetY(0);
  };

  const handleRowPointerDown = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    pressStart.current = { x: e.clientX, y: e.clientY };
    isScrollingRef.current = false;
    lastScrollYRef.current = e.clientY;
    clearLongPressTimer();
    longPressTimer.current = window.setTimeout(() => {
      draggingIdRef.current = id;
      setDraggingId(id);
      setDragOffsetY(0);
    }, LONG_PRESS_MS);

    const handleMove = (ev: PointerEvent) => {
      if (draggingIdRef.current) {
        const startY = pressStart.current?.y ?? ev.clientY;
        setDragOffsetY(ev.clientY - startY);
        return;
      }
      if (isScrollingRef.current) {
        window.scrollBy(0, lastScrollYRef.current - ev.clientY);
        lastScrollYRef.current = ev.clientY;
        return;
      }
      if (!pressStart.current) return;
      const dx = Math.abs(ev.clientX - pressStart.current.x);
      const dy = Math.abs(ev.clientY - pressStart.current.y);
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        clearLongPressTimer();
        isScrollingRef.current = true;
        lastScrollYRef.current = ev.clientY;
      }
    };

    const finish = (pointerY: number | null) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      clearLongPressTimer();
      pressStart.current = null;
      isScrollingRef.current = false;
      endDrag(pointerY);
    };

    const handleUp = (ev: PointerEvent) => finish(ev.clientY);
    // pointercancel coordinates aren't reliable (often (0,0)), so abort
    // the drag without committing a reorder instead of treating it as a drop
    const handleCancel = () => finish(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
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
        {items.map((item) => (
          <div
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el);
              else itemRefs.current.delete(item.id);
            }}
            className={`list-item${draggingId === item.id ? " dragging" : ""}`}
            style={
              draggingId === item.id
                ? { transform: `translateY(${dragOffsetY}px) scale(1.02)` }
                : undefined
            }
            onPointerDown={(e) => handleRowPointerDown(e, item.id)}
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
