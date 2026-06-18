interface CheckRowProps {
  label: string;
  icon?: string;
  checked: boolean;
  onToggle: () => void;
}

export function CheckRow({ label, icon, checked, onToggle }: CheckRowProps) {
  return (
    <button type="button" className="check-row" data-checked={checked} onClick={onToggle}>
      <span className="check-box">{checked ? "✓" : ""}</span>
      {icon && <span className="check-icon">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
