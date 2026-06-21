import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { playPoyon } from "../lib/sound";

interface CheckRowProps {
  label: string;
  icon?: string;
  checked: boolean;
  onToggle: () => void;
  onSwipeExclude?: () => void;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_INTENT_PX = 10;

export function CheckRow({ label, icon, checked, onToggle, onSwipeExclude }: CheckRowProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragXRef = useRef(0);
  const isHorizontalRef = useRef(false);
  const suppressClickRef = useRef(false);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!onSwipeExclude || checked) return;
    const startX = e.clientX;
    const startY = e.clientY;
    isHorizontalRef.current = false;
    setDragging(true);

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!isHorizontalRef.current && Math.abs(dx) > SWIPE_INTENT_PX && Math.abs(dx) > Math.abs(dy)) {
        isHorizontalRef.current = true;
      }
      if (isHorizontalRef.current) {
        const next = Math.min(0, dx);
        dragXRef.current = next;
        setDragX(next);
      }
    };

    const finish = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      setDragging(false);
      if (isHorizontalRef.current) {
        suppressClickRef.current = true;
        if (dragXRef.current <= -SWIPE_THRESHOLD) {
          onSwipeExclude();
        }
      }
      dragXRef.current = 0;
      setDragX(0);
      isHorizontalRef.current = false;
    };

    const handleUp = () => finish();
    const handleCancel = () => finish();

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    playPoyon();
    onToggle();
  };

  return (
    <div
      className={`swipe-row${checked ? " swipe-row-checked" : ""}`}
      onPointerDown={handlePointerDown}
    >
      <div className="swipe-row-hint">除外</div>
      <button
        type="button"
        className="check-row"
        data-checked={checked}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
        onClick={handleClick}
      >
        <span className="check-box">{checked ? "✓" : ""}</span>
        {icon && <span className="check-icon">{icon}</span>}
        <span>{label}</span>
      </button>
    </div>
  );
}
