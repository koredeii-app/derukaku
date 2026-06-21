import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { useSetsStore } from "../../store/setsStore";
import { useItemsStore } from "../../store/itemsStore";
import { useSchedulesStore } from "../../store/schedulesStore";

export default function SetsPage() {
  const navigate = useNavigate();
  const sets = useSetsStore((s) => s.sets);
  const items = useItemsStore((s) => s.items);
  const schedules = useSchedulesStore((s) => s.schedules);
  const itemsById = new Map(items.map((i) => [i.id, i]));
  const dailySetIds = new Set(
    schedules.filter((s) => s.recurrence.type === "daily").flatMap((s) => s.setIds),
  );

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
            <div className="row">
              <strong>{set.name}</strong>
              {dailySetIds.has(set.id) && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--color-success)",
                    border: "1px solid var(--color-success)",
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  毎日表示中
                </span>
              )}
            </div>
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
