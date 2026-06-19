# デルカク✓

出発前の忘れ物チェック — 家を出る前の「最終確認」を簡単・確実に行うためのPWA。

- アプリ名の由来: デルカク✓ ＝ 出るまえ確認
- 単体アプリ（共通エンジンは使用しない）
- サーバーなし、データは端末内（localStorage）のみに保存

## ステータス

PWA版MVP一式の実装が完了し、GitHub Pagesに公開済み（https://koredeii-app.github.io/derukaku/）。
実機検証で「アプリを閉じた状態での通知」がPWA単体では実現不可能と判明したため、Capacitorによるネイティブ化（Android）の足場を前倒しで構築済み（詳細は[05-mvp-tasks.md 11章](docs/05-mvp-tasks.md#11-capacitorネイティブ化前倒し対応2026-06-19追加)）。

設計ドキュメント:

1. [システム設計書](docs/01-system-design.md)
2. [画面一覧](docs/02-screens.md)
3. [画面遷移図](docs/03-screen-flow.md)
4. [データ構造設計](docs/04-data-structure.md)
5. [MVPタスク一覧](docs/05-mvp-tasks.md)
6. [開発スケジュール](docs/06-schedule.md)
7. [改善提案](docs/07-improvements.md)

## 技術スタック

React / Vite / PWA（vite-plugin-pwa） / Zustand / localStorage / GitHub Pages
ネイティブ化: Capacitor（Android。`@capacitor/local-notifications`でアプリ終了後も通知を到達させる）

将来構想: IndexedDB、iOS版（Capacitor + Xcode）
