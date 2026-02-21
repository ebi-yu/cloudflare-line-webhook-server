# リマインダー削除ロジック

## 概要

ユーザーがリマインド通知のクイックリプライボタン「リマインド削除」をタップすると、該当するリマインダーグループ（同じ`groupId`を持つ全てのリマインダー）を一括削除します。

## エントリーポイント

- **ファイル**: [src/index.ts](../src/index.ts)
- **関数**: `fetch()` ハンドラー
- **トリガー**: LINE Messaging APIからのWebhook（Postbackイベント）
- **判定条件**: Postbackイベントを検出した場合、`deleteReminderFromLine()` を呼び出す

## データフロー

```text
User (LINE)
  │
  │ 1. クイックリプライボタンをタップ
  │    「リマインド削除」
  ▼
LINE Messaging API
  │
  │ 2. Webhook POST (Postback Event)
  │    data: "type=delete&groupId=xxx"
  ▼
Cloudflare Workers (index.ts)
  │
  │ 3. Postbackイベント判定
  ▼
LinePostbackDeleteReminderEventVo
  │
  │ 4. dataパラメータからgroupIdを抽出
  ▼
lineWebhookToReminderUsecase.ts
  │
  │ 5. deleteReminderFromLine()
  │    ↓
  │    deleteRemindersByGroupId()
  ▼
D1 Database
  │
  │ 6. groupIdとuserIdでリマインダーを一括削除
  ▼
LINE API (Reply Message)
  │
  │ 7. 削除完了メッセージを返信
  ▼
User (LINE)
```

## 主要関数

### `deleteReminderFromLine()`

**場所**: [src/usecases/lineWebhookToReminderUsecase.ts:34](../src/usecases/lineWebhookToReminderUsecase.ts#L34)

**責務**: リマインダーグループを削除してLINEに返信

**パラメータ**:

- `groupId`: リマインダーグループID
- `userId`: LINEユーザーID
- `replyToken`: LINE返信用トークン
- `env`: 環境変数

**処理内容**:

1. `deleteRemindersByGroupId()`で一括削除
2. `sendReplyToLine()`で削除完了メッセージを返信

### `deleteRemindersByGroupId()`

**場所**: [src/infrastructure/reminderRepository.ts:70](../src/infrastructure/reminderRepository.ts#L70)

**責務**: 指定したgroupIdに属する全てのリマインダーを削除

**パラメータ**:

- `db`: D1データベースインスタンス
- `groupId`: 削除対象のグループID
- `userId`: LINEユーザーID（セキュリティ上、所有者確認のため必須）

`groupId`と`user_id`の両方を条件にして削除する。

**戻り値**: 削除されたレコード数

### `LinePostbackDeleteReminderEventVo.create()`

**場所**: `@shared/domain/line/infrastructure/vo/LinePostbackDeleteReminderEventVo.ts`

**責務**: PostbackイベントのdataパラメータからgroupIdを抽出

**入力**: PostbackイベントのdataパラメータとuserId、replyToken

**出力**: 抽出したgroupId、userId、replyToken

## 注意点

### 1. groupIdによる一括削除

- 同じメッセージから作成された5つのリマインダーを一度に削除
- 個別のリマインダーIDではなく、groupIdで削除する設計
- 「1日後だけ削除」「7日後だけ削除」といった部分削除はできない

### 2. user_idによる保護

- 削除時に必ず`user_id`も条件に含める
- 他のユーザーのリマインダーを誤って削除するのを防ぐ
- セキュリティ上重要

### 3. 既に通知済みのリマインダー

- 通知後にリマインダーは自動削除される
- 削除ボタンをタップしても、既に削除されている可能性がある
- その場合、削除件数が0となるが、エラーにはならない

### 4. タイミングによる挙動

**ケース1**: 5分後のリマインダーが通知された直後に削除ボタンをタップ

- 残り4つのリマインダー（1日後、3日後、7日後、30日後）が削除される

**ケース2**: 全てのリマインダーが通知済み

- 削除対象がなく、削除件数が0
- それでも「✅ リマインドを削除しました。」と返信される

### 5. トランザクション

- 削除は1つのSQL文で実行される（アトミック）
- 部分的な削除失敗は発生しない
- WHERE条件に合致する全てのレコードが削除される

### 6. 削除失敗時のエラーハンドリング

- 削除処理でエラーが発生した場合、500エラーが返る
- LINEには削除完了メッセージが送信されない
- ユーザーはエラーを認識できない（LINEには何も表示されない）

### 7. Postbackデータのフォーマット

- クエリパラメータ形式: `type=delete&groupId={UUID}`
- `type`パラメータは将来の拡張用（現在は使用しない）
- `groupId`のみが抽出される

### 8. クイックリプライの有効期限

- LINE クイックリプライは通知送信後、一定時間で消える
- 消えた後は削除ボタンが使用できない
- ユーザーは手動でメッセージを送るしかない（現在その機能は未実装）
