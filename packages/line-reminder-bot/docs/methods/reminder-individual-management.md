# リマインダー個別管理ロジック

## 概要

ユーザーが「削除 [ID]」「更新 [ID] [新メッセージ]」などのコマンドを送信すると、指定したIDのリマインダーを個別に削除または更新します。既存のグループ一括削除（03-reminder-deletion.md）とは異なり、個別のリマインダーのみを操作します。

## エントリーポイント

- **ファイル**: [src/index.ts](../src/index.ts)
- **関数**: `fetch()` ハンドラー
- **トリガー**: LINE Messaging APIからのWebhook（テキストメッセージイベント）
- **判定条件**:
  - 個別削除: メッセージが「削除 」「delete 」で始まる（大文字小文字区別なし）
  - 個別更新: メッセージが「更新 」「update 」で始まる（大文字小文字区別なし）

## データフロー

### 個別削除フロー

```text
User (LINE)
  │
  │ 1. メッセージ送信 ("削除 f47ac10b")
  ▼
LINE Messaging API
  │
  │ 2. Webhook POST
  ▼
Cloudflare Workers (index.ts)
  │
  │ 3. Webhook検証・ユーザー認証
  │    コマンド判定（削除コマンド？）
  │    ID抽出
  ▼
reminderIndividualManagementUsecase.ts
  │
  │ 4. deleteIndividualReminder()
  │    ↓
  │    findReminderById() (存在確認)
  │    ↓
  │    deleteReminder()
  ▼
D1 Database
  │
  │ 5. IDの前方一致とuserIdでリマインダーを削除
  ▼
LINE API (Reply Message)
  │
  │ 6. 削除完了メッセージを返信
  ▼
User (LINE)
```

### 個別更新フロー

```text
User (LINE)
  │
  │ 1. メッセージ送信 ("更新 f47ac10b 薬を飲む")
  ▼
LINE Messaging API
  │
  │ 2. Webhook POST
  ▼
Cloudflare Workers (index.ts)
  │
  │ 3. Webhook検証・ユーザー認証
  │    コマンド判定（更新コマンド？）
  │    ID・新メッセージ抽出
  ▼
reminderIndividualManagementUsecase.ts
  │
  │ 4. updateIndividualReminder()
  │    ↓
  │    findReminderById() (存在確認)
  │    ↓
  │    updateReminderMessage()
  ▼
D1 Database
  │
  │ 5. IDの前方一致とuserIdでmessageを更新
  ▼
LINE API (Reply Message)
  │
  │ 6. 更新完了メッセージを返信
  ▼
User (LINE)
```

## 主要関数

### `deleteIndividualReminder()`

**場所**: [src/usecases/reminderIndividualManagementUsecase.ts](../src/usecases/reminderIndividualManagementUsecase.ts) (新規作成)

**責務**: 指定したIDのリマインダーを削除

**パラメータ**:

- `id`: リマインダーID（短縮形でも可）
- `userId`: LINEユーザーID
- `replyToken`: LINE返信用トークン
- `env`: 環境変数

**処理内容**:

1. IDが空の場合、エラーメッセージを返信
2. `findReminderById()`でリマインダーを検索
3. 該当リマインダーが存在しない場合、エラーメッセージを返信
4. `deleteReminder()`でDBから削除
5. `sendReplyTextMessage()`で削除完了メッセージを返信

### `updateIndividualReminder()`

**場所**: [src/usecases/reminderIndividualManagementUsecase.ts](../src/usecases/reminderIndividualManagementUsecase.ts) (新規作成)

**責務**: 指定したIDのリマインダーのメッセージを更新

**パラメータ**:

- `id`: リマインダーID（短縮形でも可）
- `newMessage`: 新しいメッセージ
- `userId`: LINEユーザーID
- `replyToken`: LINE返信用トークン
- `env`: 環境変数

**処理内容**:

1. IDまたは新メッセージが空の場合、エラーメッセージを返信
2. `findReminderById()`でリマインダーを検索
3. 該当リマインダーが存在しない場合、エラーメッセージを返信
4. `updateReminderMessage()`でメッセージを更新
5. `sendReplyTextMessage()`で更新完了メッセージを返信

### `findReminderById()`

**場所**: [src/infrastructure/reminderRepository.ts](../src/infrastructure/reminderRepository.ts) (新規追加)

**責務**: IDでリマインダーを検索（短縮IDにも対応）

**パラメータ**:

- `db`: D1データベースインスタンス
- `userId`: LINEユーザーID
- `id`: 完全なUUIDまたは短縮形（前方一致で検索）

`user_id`と前方一致`id`で検索し、最初の1件を返す。

**戻り値**: `Promise<Reminder | null>`

### `updateReminderMessage()`

**場所**: [src/infrastructure/reminderRepository.ts](../src/infrastructure/reminderRepository.ts) (新規追加)

**責務**: リマインダーのmessageフィールドを更新

**パラメータ**:

- `db`: D1データベースインスタンス
- `id`: リマインダーID
- `userId`: LINEユーザーID
- `newMessage`: 更新後のメッセージ

`id`と`user_id`を条件に`message`フィールドを更新する。

**戻り値**: 更新成功/失敗

### `extractIdFromCommand()`

**場所**: [src/usecases/reminderIndividualManagementUsecase.ts](../src/usecases/reminderIndividualManagementUsecase.ts) (新規作成)

**責務**: コマンド文字列からIDを抽出

**処理内容**:

1. コマンド部分を正規表現で除去
2. trimしてIDを返す

**例**:

- 入力: `削除 f47ac10b` → 出力: `f47ac10b`

### `extractUpdateCommand()`

**場所**: [src/usecases/reminderIndividualManagementUsecase.ts](../src/usecases/reminderIndividualManagementUsecase.ts) (新規作成)

**責務**: 更新コマンドからIDと新メッセージを抽出

**処理内容**:

1. コマンド部分を除去
2. 残りの先頭がID、その後ろが新メッセージ

**例**:

- 入力: `更新 f47ac10b 薬を飲む` → 出力: `{ id: 'f47ac10b', newMessage: '薬を飲む' }`

## 注意点

### 1. IDの前方一致検索

- ユーザーは短縮ID（最初の8文字）を入力
- DBでは前方一致で検索
- 同一ユーザー内で衝突する可能性は極めて低い

### 2. IDが見つからない場合

エラーメッセージ:

```text
❌ リマインダーが見つかりませんでした。

ID: f47ac10b

一覧を確認: 「一覧」
```

### 3. 削除完了メッセージ

```text
✅ リマインダーを削除しました。

ID: f47ac10b
メッセージ: 水を飲む
実行予定: [5分後] 12/25 14:35
```

### 4. 更新完了メッセージ

```text
✅ リマインダーを更新しました。

ID: f47ac10b
変更前: 水を飲む
変更後: 薬を飲む
実行予定: [5分後] 12/25 14:35
```

### 5. グループ一括削除との違い

**既存（グループ一括削除）**:

- Postback イベント（クイックリプライボタン）
- `groupId` で同じメッセージの5つをまとめて削除

**新規（個別削除）**:

- テキストメッセージコマンド
- `id` で個別のリマインダーのみ削除

### 6. user_idによる保護

- 削除・更新時に必ず `user_id` も条件に含める
- 他のユーザーのリマインダーを誤って操作するのを防ぐ
- セキュリティ上重要

### 7. 更新対象フィールド

現在の仕様では `message` のみ更新:

- 実行時刻（`execution_time`）は変更しない
- 間隔ラベル（`interval_label`）は変更しない

**拡張案**:

- 実行時刻の変更コマンド: `時刻変更 f47ac10b 明日14時`
- 間隔ラベルの変更は不要（自動生成される情報）

### 8. コマンドパース失敗

**削除コマンドでIDなし**:

```text
❌ IDを指定してください。

使い方:
削除 ID
delete ID

例:
削除 f47ac10b
```

**更新コマンドで新メッセージなし**:

```text
❌ 新しいメッセージを入力してください。

使い方:
更新 ID 新しいメッセージ
update ID new message

例:
更新 f47ac10b 薬を飲む
```

### 9. トランザクション

- 削除・更新は1つのSQL文で実行される（アトミック）
- 部分的な失敗は発生しない

### 10. 日本語・英語対応

- コマンド: `削除/delete`, `更新/update` の両方に対応
- 大文字小文字は区別しない（`Delete`, `UPDATE` も可）

### 11. コマンド判定の優先順位

コマンドの判定順序:

1. 一覧表示（`一覧`, `list`）
2. 検索（「検索 」「search 」で始まる）
3. 個別削除（「削除 」「delete 」で始まる）
4. 個別更新（「更新 」「update 」で始まる）
5. 通常のリマインダー作成（上記以外）

### 12. 複数マッチの扱い

短縮IDで複数のリマインダーがマッチした場合:

- 最初の1件のみ取得
- 実際には UUID の衝突は極めて稀

より安全な実装:

- 複数マッチした場合はエラーにする
- ユーザーにより長いIDの入力を促す

### 13. 期限切れリマインダーの操作

- 期限切れでもまだ削除されていないリマインダーは操作可能
- 削除済みのリマインダーは「見つかりませんでした」エラー

### 14. execution_timeの変更

現在の仕様では未対応。拡張案:

**コマンド例**:

```text
時刻変更 f47ac10b 明日14時
reschedule f47ac10b tomorrow 14:00
```

**処理内容**:

1. 自然言語日時パース（例: `明日14時` → Unix timestamp）
2. `execution_time`フィールドを更新

**課題**:

- 日本語の日時パースが複雑
- タイムゾーン処理
- 相対日時（明日、来週など）の解釈
