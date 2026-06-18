# デルカク✓

出発前の忘れ物チェック — 家を出る前の「最終確認」を簡単・確実に行うためのPWA。

- アプリ名の由来: デルカク✓ ＝ 出るまえ確認
- 単体アプリ（共通エンジンは使用しない）
- サーバーなし、データは端末内（localStorage）のみに保存

## ステータス

現在は実装前フェーズ。以下の初回成果物を提出済み。

1. [システム設計書](docs/01-system-design.md)
2. [画面一覧](docs/02-screens.md)
3. [画面遷移図](docs/03-screen-flow.md)
4. [データ構造設計](docs/04-data-structure.md)
5. [MVPタスク一覧](docs/05-mvp-tasks.md)
6. [開発スケジュール](docs/06-schedule.md)
7. [改善提案](docs/07-improvements.md)

## 技術スタック（予定）

React / Vite / PWA（vite-plugin-pwa） / Zustand / localStorage / GitHub Pages

将来構想: IndexedDB、Capacitorによるネイティブアプリ化（Android／iOS）
