# データ構造設計 — デルカク✓

## 1. 全体方針

- 全データは `localStorage` にJSON文字列として保存する。
- キーは `derukaku:` をプレフィックスとし、ストア単位（items / sets / schedules / sessions / settings）で分割する。1キーに全データを詰め込まず分割することで、読み書きの粒度を小さくし、将来IndexedDBへ移行する際もストア＝テーブルとして対応させやすくする。
- 各ストアのルートに `schemaVersion` を持たせ、将来の構造変更をマイグレーション関数で吸収する。

## 2. localStorageキー設計

| キー | 内容 | 型 |
|---|---|---|
| `derukaku:items` | チェック項目一覧 | `Item[]` |
| `derukaku:sets` | セット一覧 | `ItemSet[]` |
| `derukaku:schedules` | カレンダー登録（予定）一覧 | `ScheduleEntry[]` |
| `derukaku:sessions` | チェック実行履歴（直近N件、将来のAI提案用） | `CheckSession[]` |
| `derukaku:settings` | アプリ全体設定 | `AppSettings` |
| `derukaku:schemaVersion` | スキーマバージョン番号 | `number` |

## 3. 型定義（TypeScript）

```ts
// 共通
type ISODateString = string; // "2026-06-20"
type ISODateTimeString = string; // "2026-06-20T07:30:00+09:00"

// 1. チェック項目
interface Item {
  id: string;           // uuid
  name: string;         // 例: "財布"
  icon?: string;        // 任意。絵文字 or アイコンキー
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// 2. セット（項目のテンプレート）
interface ItemSet {
  id: string;
  name: string;          // 例: "仕事セット"
  itemIds: string[];     // Item.id の配列
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// 3. 繰り返し設定
type RecurrenceType = "once" | "weekly" | "daily";

interface Recurrence {
  type: RecurrenceType;
  date?: ISODateString;        // type === "once" の場合の対象日
  daysOfWeek?: number[];       // type === "weekly" の場合。0=日曜〜6=土曜
}

// 4. 通知設定
interface NotificationConfig {
  enabled: boolean;
  time: string;                 // "07:30" (HH:mm, ローカル時刻)
  snoozeOptions: number[];      // 分単位。例: [5, 10, 15]
}

// 5. カレンダー登録（予定）
interface ScheduleEntry {
  id: string;
  recurrence: Recurrence;
  setIds: string[];             // 紐づくセット（複数可）
  itemIds: string[];            // 個別に追加した項目（セットに含まれないもの）
  notification: NotificationConfig;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// 6. チェック実行ログ（履歴）
interface CheckSessionItemResult {
  itemId: string;
  checked: boolean;
  checkedAt?: ISODateTimeString;
}

interface CheckSession {
  id: string;
  scheduleEntryId?: string;     // 予定経由でない場合（任意実行）は undefined
  targetDate: ISODateString;    // どの日のチェックか
  items: CheckSessionItemResult[];
  startedAt: ISODateTimeString;
  completedAt?: ISODateTimeString;
  status: "in_progress" | "completed" | "abandoned";
}

// 7. アプリ全体設定
interface AppSettings {
  fontSize: "standard" | "large" | "extra-large";
  defaultSnoozeMinutes: number;
  notificationPermission: "default" | "granted" | "denied";
  onboardingCompleted: boolean;
}
```

## 4. 重複排除ロジックのデータフロー

S03（チェック実行画面）表示時、対象の `ScheduleEntry`（複数の場合あり）から以下の手順で表示用リストを生成する。これは保存データを変更せず、表示直前に計算する。

```
1. 対象ScheduleEntryの setIds から ItemSet を解決 → 各セットの itemIds を展開
2. 対象ScheduleEntryの itemIds（個別追加分）と合算
3. Item.id を Set（集合）で重複排除
4. 重複排除後の Item.id 配列から Item 実体を解決し、画面に表示する順序（登録順 or 任意の固定順）に並べる
5. CheckSession.items はこの重複排除後のリストを基に生成する
```

例（仕様書の例に対応）:
```
仕事セット.itemIds   = [財布, スマホ]
医療セット.itemIds   = [財布, スマホ, 保険証]
→ 重複排除後          = [財布, スマホ, 保険証]
```

## 5. マイグレーション方針

- `derukaku:schemaVersion` を起動時に確認し、保存データのバージョンより新しい場合のみマイグレーション関数（`migrations/v1-to-v2.ts` のような連番ファイル）を順次適用する。
- マイグレーション関数は純粋関数とし、失敗時は旧データをバックアップキー（例: `derukaku:items:backup-v1`）に退避してから変換する。

## 6. 将来のIndexedDB移行に向けた抽象化

`src/lib/storage.ts` に以下のインターフェースを定義し、現状はlocalStorage実装、将来はIndexedDB実装に差し替え可能にする。

```ts
interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
```

Zustandストアはこのインターフェース経由でのみ永続化を行い、具体的な保存先を知らない設計とする。
