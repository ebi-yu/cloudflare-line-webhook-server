# リマインダー通知ロジック

## 概要

Cloudflare Workers Cron Triggersにより5分ごとに実行され、期限が来たリマインダーを取得してLINEにプッシュメッセージを送信します。通知後、該当リマインダーはDBから削除されます。

## エントリーポイント

- **ファイル**: [src/index.ts](../src/index.ts)
- **関数**: `scheduled()` ハンドラー
- **トリガー**: Cron (`*/5 * * * *` - 5分ごと)
- **処理内容**: `ctx.waitUntil()` を使用して `processScheduledReminders()` を非同期実行

## データフロー

```text
Cron Trigger (*/5 * * * *)
  │
  │ 1. 5分ごとに実行
  ▼
Cloudflare Workers (index.ts)
  │
  │ 2. scheduled() ハンドラー
  ▼
scheduledReminderUsecase.ts
  │
  │ 3. processScheduledReminders()
  │    ↓
  │    getDueReminders() - 期限が来たリマインダーを取得
  ▼
D1 Database
  │
  │ 4. 期限到達リマインダーを取得
  │    ↓ リマインダーリスト返却
  ▼
scheduledReminderUsecase.ts
  │
  │ 5. Loop: 各リマインダーに対して
  │    ├─ sendPushMessage() - プッシュ通知
  │    └─ deleteReminder() - DB削除
  ▼
LINE Messaging API
  │
  │ 6. プッシュメッセージ送信
  ▼
User (LINE)
```

## 主要関数

### `processScheduledReminders()`

**場所**: [src/usecases/scheduledReminderUsecase.ts:7](../src/usecases/scheduledReminderUsecase.ts#L7)

**責務**: 期限が来たリマインダーを処理して通知

**パラメータ**:

- `env`: 環境変数（DB、LINE_CHANNEL_TOKENなど）

**処理フロー**:

1. `getDueReminders()`で期限到達リマインダーを取得
2. 各リマインダーに対してループ処理:
   - 間隔ラベルを含むメッセージを構築
   - クイックリプライ（削除ボタン）を追加
   - `sendPushMessage()`でLINEに送信
   - `deleteReminder()`でDBから削除
3. エラー発生時も処理を継続（個別にtry-catch）

### `getDueReminders()`

**場所**: [src/infrastructure/reminderRepository.ts:79](../src/infrastructure/reminderRepository.ts#L79)

**責務**: 実行時刻が現在時刻以前のリマインダーをすべて取得

**戻り値**: `Promise<Reminder[]>`

### `sendPushMessage()`

**場所**: `@shared/domain/line/infrastructure/lineApiClient.ts`

**責務**: LINEユーザーにプッシュメッセージを送信

**パラメータ**:

- `userId`: 送信先LINEユーザーID
- `message`: 送信メッセージ内容
- `channelToken`: LINEチャンネルアクセストークン
- `quickReply`: クイックリプライボタン（任意）

### `deleteReminder()`

**場所**: [src/infrastructure/reminderRepository.ts:64](../src/infrastructure/reminderRepository.ts#L64)

**責務**: 指定したリマインダーをDBから削除。`id`と`user_id`の両方を条件にして削除する。

## 注意点

### 1. Cron実行頻度

- **設定**: `*/5 * * * *` (5分ごと)
- **実行タイミング**: 00:00, 00:05, 00:10, ..., 23:55
- **遅延**: 最大5分の遅延が発生する可能性

例：

- リマインダー実行予定: 14:32
- 実際の通知時刻: 14:35（次のCron実行時）

### 2. エラーハンドリング

個別のリマインダー処理はtry-catchで囲まれています。

**メリット**:

- 一部のリマインダーが失敗しても他は正常に送信される
- システム全体の可用性が向上

**デメリット**:

- 失敗したリマインダーはDBに残り続ける
- 次回のCron実行時に再試行される（リトライ機能として動作）

### 3. ctx.waitUntil()の使用

- Cloudflare Workersの実行時間制限を回避
- リクエストが完了した後も処理を継続
- 長時間実行される可能性のあるタスクに必須

### 4. 同じリマインダーの重複送信防止

- 削除が成功すれば次回のCron実行時には取得されない
- 削除が失敗した場合、次回のCron実行時に再送信される可能性
- 現在、重複送信防止メカニズムは実装されていない

### 5. タイムスタンプの精度

- ミリ秒単位で比較
- execution_timeもミリ秒単位で保存されている
- 精度は十分だが、Cron実行が5分ごとなので実質的な精度は5分

### 6. Cloudflare Workersの制限

- **CPU時間**: 最大50ms（無料プラン）、最大50ms（有料プラン）
- **実行時間**: 最大30秒
- 大量のリマインダーを処理する場合、バッチ処理や並列化を検討すべき

### 7. LINE API制限

- **プッシュメッセージ**: 月間の送信数制限あり（プランによる）
- **レート制限**: 1秒あたりのAPI呼び出し数に制限
- 大量送信時はレート制限エラーに注意
