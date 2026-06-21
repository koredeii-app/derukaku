import { useEffect } from "react";

export interface ToastItem {
  id: string;
  message: string;
  onUndo: () => void;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  durationMs?: number;
}

export function ToastStack({ toasts, onDismiss, durationMs = 6000 }: ToastStackProps) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} durationMs={durationMs} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastRow({
  toast,
  durationMs,
  onDismiss,
}: {
  toast: ToastItem;
  durationMs: number;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.id, durationMs, onDismiss]);

  return (
    <div className="toast">
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={() => {
          toast.onUndo();
          onDismiss(toast.id);
        }}
      >
        元に戻す
      </button>
    </div>
  );
}
