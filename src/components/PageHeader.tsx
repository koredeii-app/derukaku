import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function PageHeader({ title, subtitle, showBack }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="row" style={{ marginBottom: "var(--space-4)" }}>
      {showBack && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          aria-label="戻る"
        >
          ← 戻る
        </button>
      )}
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
