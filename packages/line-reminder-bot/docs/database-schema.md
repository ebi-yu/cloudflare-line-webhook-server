# データベーススキーマ

## 概要

LINE Reminder Botは、Cloudflare D1（SQLite）を使用してリマインダーを永続化します。シンプルな単一テーブル構成で、必要最小限のカラムとインデックスで構成されています。

## テーブル定義

### reminders テーブル

リマインダー情報を保存するメインテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| `id` | TEXT | PRIMARY KEY | リマインダーID（UUID） |
| `user_id` | TEXT | NOT NULL | LINEユーザーID |
| `message` | TEXT | NOT NULL | リマインドメッセージ内容 |
| `execution_time` | INTEGER | NOT NULL | 実行時刻（Unix timestamp in milliseconds） |
| `created_at` | INTEGER | NOT NULL | 作成日時（Unix timestamp in milliseconds） |
| `group_id` | TEXT | NULLABLE | リマインダーグループID（UUID） |
| `interval_label` | TEXT | NULLABLE | リマインド間隔のラベル（例: '5分後', '1日後'） |

### DDL

```sql
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  execution_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  group_id TEXT,
  interval_label TEXT
);
```

## インデックス

パフォーマンス最適化のため、頻繁にクエリされるカラムにインデックスを設定しています。

| インデックス名 | カラム | 用途 |
|-------------|--------|------|
| `idx_reminders_user_id` | `user_id` | ユーザーIDでのリマインダー検索 |
| `idx_reminders_execution_time` | `execution_time` | スケジューラーでの期限リマインダー検索 |
| `idx_reminders_group_id` | `group_id` | グループIDでのリマインダー一括削除 |

### DDL

```sql
-- ユーザーIDで検索
CREATE INDEX IF NOT EXISTS idx_reminders_user_id
ON reminders(user_id);

-- 実行時刻で検索（スケジューラー用）
CREATE INDEX IF NOT EXISTS idx_reminders_execution_time
ON reminders(execution_time);

-- グループIDで検索
CREATE INDEX IF NOT EXISTS idx_reminders_group_id
ON reminders(group_id);
```

## マイグレーション履歴

### 0001_create_reminders.sql

**実行時期**: 初期構築時

**内容**: 基本的なremindersテーブルとインデックスを作成

```sql
-- リマインダーテーブル
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  execution_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- インデックス: ユーザーIDで検索
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- インデックス: 実行時刻で検索（スケジューラー用）
CREATE INDEX IF NOT EXISTS idx_reminders_execution_time ON reminders(execution_time);
```

### 0002_add_group_id.sql

**実行時期**: グループ削除機能追加時

**内容**: グループID・間隔ラベルカラムを追加

```sql
-- リマインダーグループを識別するためのカラムを追加
ALTER TABLE reminders ADD COLUMN group_id TEXT;
ALTER TABLE reminders ADD COLUMN interval_label TEXT;

-- インデックス: グループIDで検索
CREATE INDEX IF NOT EXISTS idx_reminders_group_id ON reminders(group_id);
```

## データ型の詳細

### id (TEXT)

- **形式**: UUID v4
- **生成**: `crypto.randomUUID()`
- **例**: `"f47ac10b-58cc-4372-a567-0e02b2c3d479"`
- **用途**: リマインダーの一意識別子

### user_id (TEXT)

- **形式**: LINE User ID
- **例**: `"U4af4980629..."`
- **用途**: リマインダーの所有者を特定

### message (TEXT)

- **形式**: 任意のテキスト
- **例**: `"水を飲む"`
- **制限**: 現在、長さ制限なし（SQLiteのTEXT型の上限に依存）

### execution_time (INTEGER)

- **形式**: Unix timestamp（ミリ秒）
- **例**: `1703491500000` (2023-12-25 14:35:00 JST)
- **用途**: リマインダー実行予定時刻
- **計算**: `Date.now() + interval.minutes * 60 * 1000`

### created_at (INTEGER)

- **形式**: Unix timestamp（ミリ秒）
- **例**: `1703491200000` (2023-12-25 14:30:00 JST)
- **用途**: リマインダー作成日時
- **設定**: `Date.now()`

### group_id (TEXT, NULLABLE)

- **形式**: UUID v4
- **生成**: `crypto.randomUUID()`
- **例**: `"f47ac10b-58cc-4372-a567-0e02b2c3d479"`
- **用途**: 同じメッセージから作成された複数のリマインダーをグループ化
- **NULL**: 単一リマインダー（グループ化不要）の場合

### interval_label (TEXT, NULLABLE)

- **形式**: 文字列ラベル
- **例**: `"5分後"`, `"1日後"`, `"3日後"`, `"7日後"`, `"30日後"`
- **用途**: リマインド通知時に表示
- **NULL**: ラベルなし

## クエリパターン

### リマインダー作成

```sql
INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id, interval_label)
VALUES (?, ?, ?, ?, ?, ?, ?);
```

**使用箇所**: [src/infrastructure/reminderRepository.ts:34](../src/infrastructure/reminderRepository.ts#L34)

### 期限が来たリマインダーを取得

```sql
SELECT * FROM reminders
WHERE execution_time <= ?;
```

**使用箇所**: [src/infrastructure/reminderRepository.ts:81](../src/infrastructure/reminderRepository.ts#L81)

**インデックス使用**: `idx_reminders_execution_time`

### ユーザーのリマインダー一覧を取得

```sql
SELECT * FROM reminders
WHERE user_id = ?
ORDER BY execution_time ASC;
```

**使用箇所**: [src/infrastructure/reminderRepository.ts:56](../src/infrastructure/reminderRepository.ts#L56)

**インデックス使用**: `idx_reminders_user_id`

### 単一リマインダーを削除

```sql
DELETE FROM reminders
WHERE id = ? AND user_id = ?;
```

**使用箇所**: [src/infrastructure/reminderRepository.ts:65](../src/infrastructure/reminderRepository.ts#L65)

### グループIDで一括削除

```sql
DELETE FROM reminders
WHERE group_id = ? AND user_id = ?;
```

**使用箇所**: [src/infrastructure/reminderRepository.ts:71](../src/infrastructure/reminderRepository.ts#L71)

**インデックス使用**: `idx_reminders_group_id`

## データ例

### 1つのメッセージから作成される5つのリマインダー

```sql
-- 5分後
id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
user_id: "U4af4980629..."
message: "水を飲む"
execution_time: 1703491500000  -- 2023-12-25 14:35:00
created_at: 1703491200000      -- 2023-12-25 14:30:00
group_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
interval_label: "5分後"

-- 1日後
id: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
user_id: "U4af4980629..."
message: "水を飲む"
execution_time: 1703577600000  -- 2023-12-26 14:30:00
created_at: 1703491200000      -- 2023-12-25 14:30:00
group_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
interval_label: "1日後"

-- 3日後
id: "c3d4e5f6-a7b8-9012-cdef-123456789012"
user_id: "U4af4980629..."
message: "水を飲む"
execution_time: 1703750400000  -- 2023-12-28 14:30:00
created_at: 1703491200000      -- 2023-12-25 14:30:00
group_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
interval_label: "3日後"

-- 7日後、30日後も同様
```

## パフォーマンス考慮事項

### インデックスの効果

| クエリ | インデックスなし | インデックスあり |
|-------|--------------|--------------|
| `WHERE execution_time <= ?` | O(n) 全テーブルスキャン | O(log n) インデックススキャン |
| `WHERE user_id = ?` | O(n) 全テーブルスキャン | O(log n) インデックススキャン |
| `WHERE group_id = ?` | O(n) 全テーブルスキャン | O(log n) インデックススキャン |

### ストレージサイズ推定

1リマインダーあたりの推定サイズ:
- `id`: 36 bytes (UUID)
- `user_id`: ~30 bytes
- `message`: 可変（平均 50 bytes と仮定）
- `execution_time`: 8 bytes
- `created_at`: 8 bytes
- `group_id`: 36 bytes
- `interval_label`: ~10 bytes

**合計**: ~180 bytes/リマインダー

1ユーザーが1メッセージで5リマインダー作成:
- 5 × 180 bytes = 900 bytes

1000ユーザーが各10メッセージ作成:
- 1000 × 10 × 5 × 180 bytes = 9 MB

### Cloudflare D1の制限

- **無料プラン**: 5 GB ストレージ
- **有料プラン**: 50 GB ストレージ
- **クエリ数制限**: 1日あたり50,000クエリ（無料プラン）

## マイグレーション実行方法

### ローカル環境

```bash
cd packages/line-reminder-bot
pnpm d1:migrations:apply:local
```

### 本番環境

```bash
cd packages/line-reminder-bot
pnpm d1:migrations:apply
```

## データベース直接操作

### リマインダー一覧を確認

```bash
wrangler d1 execute line-reminder-db --command "SELECT * FROM reminders LIMIT 10"
```

### 特定ユーザーのリマインダーを確認

```bash
wrangler d1 execute line-reminder-db --command \
  "SELECT * FROM reminders WHERE user_id = 'U4af4980629...'"
```

### 期限が来たリマインダーを確認

```bash
wrangler d1 execute line-reminder-db --command \
  "SELECT * FROM reminders WHERE execution_time <= $(date +%s)000"
```

### 全データ削除（開発環境のみ）

```bash
wrangler d1 execute line-reminder-db --command "DELETE FROM reminders"
```
