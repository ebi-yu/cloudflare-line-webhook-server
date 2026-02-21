# リマインダー作成ロジック

## 概要

LINEユーザーがメッセージを送信すると、自動的に5つの異なるタイミング（5分後、1日後、3日後、7日後、30日後）でリマインダーを作成します。同じメッセージから作成されたリマインダーは`groupId`で紐付けられ、後で一括削除できるようになっています。

## エントリーポイント

- **ファイル**: [src/index.ts](../src/index.ts)
- **関数**: `fetch()` ハンドラー
- **トリガー**: LINE Messaging APIからのWebhook（テキストメッセージイベント）
- **判定条件**: テキストメッセージイベントを検出した場合、`createReminderFromLine()` を呼び出す

## データフロー

```
User (LINE)
  │
  │ 1. メッセージ送信 ("水を飲む")
  ▼
LINE Messaging API
  │
  │ 2. Webhook POST
  ▼
Cloudflare Workers (index.ts)
  │
  │ 3. Webhook検証・ユーザー認証
  ▼
lineWebhookToReminderUsecase.ts
  │
  │ 4. createReminderFromLine()
  │    ↓
  │    saveReminderToDB()
  │      ↓ Loop 5回
  │      createReminder() × 5
  ▼
D1 Database
  │
  │ 5. リマインダーを5件INSERT（groupIdで紐付け）
  ▼
LINE API (Reply Message)
  │
  │ 6. 登録完了メッセージを返信
  ▼
User (LINE)
```

## 主要関数

### `createReminderFromLine()`

**場所**: [src/usecases/lineWebhookToReminderUsecase.ts:17](../src/usecases/lineWebhookToReminderUsecase.ts#L17)

**責務**: LINEメッセージを受け取り、リマインダーを作成してLINEに返信

**パラメータ**:

- `message`: ユーザーが送信したメッセージ
- `userId`: LINEユーザーID
- `replyToken`: LINE返信用トークン
- `env`: 環境変数（DB、LINE_CHANNEL_TOKENなど）

**処理内容**:
1. `saveReminderToDB()`で5つのリマインダーを作成
2. 登録結果メッセージを整形
3. `sendReplyToLine()`でLINEに返信

### `saveReminderToDB()`

**場所**: [src/usecases/lineWebhookToReminderUsecase.ts:51](../src/usecases/lineWebhookToReminderUsecase.ts#L51)

**責務**: メッセージから5つのリマインダーをDBに保存

**処理内容**:
1. メッセージをtrim
2. `groupId`を生成（UUID）
3. デフォルト間隔（5分後、1日後、3日後、7日後、30日後）でループ
4. 各間隔で`createReminder()`を呼び出し

### `createReminder()`

**場所**: [src/infrastructure/reminderRepository.ts:21](../src/infrastructure/reminderRepository.ts#L21)

**責務**: 単一のリマインダーをD1データベースに保存

**パラメータ**:

- `db`: D1データベースインスタンス
- `userId`: LINEユーザーID
- `message`: リマインドメッセージ内容
- `executionTime`: 実行時刻（Unixタイムスタンプ、ミリ秒）
- `groupId`: グループID（任意）
- `intervalLabel`: 間隔ラベル（任意）

**処理内容**:
1. UUIDで`id`を生成
2. 現在時刻で`createdAt`を設定
3. `Reminder`オブジェクトを構築
4. D1にINSERT

## 注意点

### 1. タイムゾーン

日時表示は`Asia/Tokyo`タイムゾーンで表示されます。

### 2. groupIdの重要性

- 同じメッセージから作成された5つのリマインダーは同じ`groupId`を持つ
- これにより削除時に一括削除が可能
- 各リマインダーは個別に通知される（グループではない）

### 3. executionTimeの精度

- ミリ秒単位のUnixタイムスタンプで保存
- Cron実行が5分ごとなので、最大5分の遅延が発生する可能性

### 4. トランザクション

- 5つのINSERTは個別に実行される（トランザクションなし）
- 途中で失敗した場合、一部のリマインダーのみ作成される可能性がある
- エラーはキャッチされ、500エラーが返される

### 5. メッセージの長さ制限

- 現在、メッセージ長の制限チェックは実装されていない
- D1のTEXT型の上限に依存
- 必要に応じてバリデーションを追加すべき
