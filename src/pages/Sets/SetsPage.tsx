import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";

export default function SetsPage() {
  const navigate = useNavigate();
  const sets = useSetsStore((s) => s.sets);
  const items = useItemsStore((s) => s.items);
  const itemsById = new Map(items.map((i) => [i.id, i]));

  return (
    <div className="page">
      <PageHeader title="セット" subtitle="よく使う持ち物の組み合わせをテンプレート化します" />

      <div className="stack" style={{ marginBottom: "var(--space-4)" }}>
        {sets.length === 0 && <div className="empty-state card">まだセットがありません</div>}
        {sets.map((set) => (
          <button
            key={set.id}
            type="button"
            className="card stack"
            style={{ textAlign: "left", border: "1px solid var(--color-border)", cursor: "pointer" }}
            onClick={() => navigate(`/sets/${set.id}/edit`)}
          >
            <strong>{set.name}</strong>
            <span style={{ color: "var(--color-text-muted)" }}>
              {set.itemIds.map((id) => itemsById.get(id)?.name).filter(Boolean).join(" / ") ||
                "項目未設定"}
            </span>
          </button>
        ))}
      </div>

      <Button onClick={() => navigate("/sets/new")}>＋ セットを追加</Button>
    </div>
  );
}
