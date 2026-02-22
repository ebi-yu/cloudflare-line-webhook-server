# ADR-001: Controller層の導入

## ステータス

採用

## 決定日

2026-02-22

## 文脈

当初の実装では、UsecaseがLINE APIの呼び出しを含んでいました。

```typescript
// 以前の実装（問題あり）
export async function createReminder(vo: {
  message: string;
  userId: string;
  replyToken: string;
  env: Env;
}): Promise<void> {
  // ビジネスロジック
  const result = await saveReminderToDB(...);

  // LINE APIの呼び出し（混在している！）
  await sendReplyTextMessage(replyToken, responseMessage, env.LINE_CHANNEL_TOKEN);
}
```

### 問題点

1. **ビジネスロジックとプレゼンテーション層が混在**
   - 「リマインダーを作成する」というビジネスロジックと「LINEに通知する」というプレゼンテーション処理が同じ関数内に
   - 関心の分離の原則に違反

2. **テストが困難**
   - Usecaseのユニットテストを書く際、LINE APIをモックする必要がある
   - モックコードが複雑になり、テストの保守性が低下
   - ビジネスロジックのテストなのに、外部APIに依存してしまう

3. **再利用性の欠如**
   - 同じビジネスロジックをSlackやCLIで使いたい場合、LINE固有のコードが邪魔になる
   - プラットフォーム非依存なUsecaseにできない

## 決定

Controller層を新たに導入し、以下のように責務を分離します:

### Usecase（ビジネスロジックのみ）

```typescript
export async function createReminder(vo: {
  message: string;
  userId: string;
  db: D1Database;
}): Promise<CreateReminderResult> {
  // ビジネスロジックのみ
  const trimmed = message.trim();
  const scheduledTimes = [];

  for (const interval of DEFAULT_REMINDER_INTERVALS) {
    await saveReminder(db, userId, {...});
    scheduledTimes.push({...});
  }

  return { message: trimmed, scheduledTimes };
}
```

### Controller（Usecaseの呼び出し + LINE API）

```typescript
export async function handleCreateReminder(vo: {
  event: MessageEvent;
  config: LineWebhookConfigVo;
  env: Env;
}): Promise<void> {
  // 1. Usecaseを呼び出す
  const result = await createReminder({
    message: messageEvent.message,
    userId: messageEvent.userId,
    db: env.DB,
  });

  // 2. 結果をフォーマット
  const responseMessage = formatCreateReminderResponse(result);

  // 3. LINE APIに送信
  await sendReplyTextMessage(replyToken, responseMessage, env.LINE_CHANNEL_TOKEN);
}
```

## 結果

### メリット

1. **テスタビリティの向上**
   - UsecaseはLINE APIに依存しないため、モックなしでユニットテスト可能
   - ビジネスロジックのテストが高速で安定

2. **再利用性の向上**
   - 同じUsecaseをLINE、Slack、CLI、Web UI等、あらゆるインターフェースで利用可能
   - プラットフォーム非依存なビジネスロジック

3. **関心の分離が明確**
   - Usecase: ビジネスロジック
   - Controller: プレゼンテーション層との橋渡し
   - 各層の責務が明確

4. **保守性の向上**
   - ビジネスロジックの変更とプレゼンテーション層の変更が独立
   - どこを修正すべきかが明確

### デメリット

1. **ファイル数の増加**
   - Controllerディレクトリが追加される
   - しかし、責務が明確になるため許容範囲

2. **学習コスト**
   - 新しいメンバーがレイヤー構造を理解する必要がある
   - しかし、ドキュメント化することで軽減

## 代替案

### 代替案1: Usecaseのまま維持

**却下理由:**
- テストが困難
- 再利用性が低い
- 関心の分離が不明確

### 代替案2: Presenter層を追加（Clean Architectureの厳密な実装）

```
Controller → Usecase → Presenter → LINE API
```

**却下理由:**
- 小規模プロジェクトには過剰
- Controller層で十分に責務分離ができる
- 将来必要になれば、Controllerを分割してPresenter層を追加することも可能

## 参考資料

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
