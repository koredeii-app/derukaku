import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";

export default function CheckCompletePage() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: "4rem", marginBottom: "var(--space-3)" }}>✅</div>
      <h1 className="page-title">確認完了！</h1>
      <p className="page-subtitle">忘れ物はありません。気をつけて行ってらっしゃい。</p>
      <Button onClick={() => navigate("/")} style={{ marginTop: "var(--space-5)" }}>
        ホームへ戻る
      </Button>
    </div>
  );
}
