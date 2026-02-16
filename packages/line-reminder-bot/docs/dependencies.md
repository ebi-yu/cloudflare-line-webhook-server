# 依存関係

## 概要

LINE Reminder Botは、共有ライブラリ（`@shared`）に依存しています。この共有ライブラリは、LINE関連の共通ロジックを提供し、複数のLINEボットプロジェクト間で再利用可能な形で実装されています。

## パス解決

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../../shared/*"]
    }
  }
}
```

**実際のパス**: `packages/line-reminder-bot` → `shared/`

## 依存モジュール一覧

### 1. 型定義

#### `@shared/domain/line/types`

**場所**: `shared/domain/line/types.ts`

**エクスポート**:
```typescript
export type { LineWebhookEvent };
```

**用途**: LINE Messaging APIから受け取るWebhookイベントの型定義

**使用箇所**:
- [src/types.ts:1](../src/types.ts#L1)

---

### 2. アプリケーション層

#### `@shared/domain/line/application/checkUserAuthorization`

**場所**: `shared/domain/line/application/checkUserAuthorization.ts`

**エクスポート**:
```typescript
export async function checkUserAuthorization(params: {
  userId: string;
  replyToken: string;
  config: LineWebhookConfigVo;
}): Promise<void>
```

**責務**: 許可されたLINEユーザーのみがボットを使用できるようにチェック

**処理内容**:
1. `userId`と`config.allowedUserId`を比較
2. 一致しない場合、`ServerErrorException`をthrow
3. 一致した場合、何もしない（処理を続行）

**使用箇所**:
- [src/index.ts:34](../src/index.ts#L34)

**例**:
```typescript
await checkUserAuthorization({
  userId: "U4af4980629...",
  replyToken: "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
  config: LineWebhookConfigVo.create({
    channelSecret: env.LINE_CHANNEL_SECRET,
    channelToken: env.LINE_CHANNEL_TOKEN,
    allowedUserId: env.LINE_OWN_USER_ID,
  }),
});
```

---

### 3. インフラストラクチャ層

#### `@shared/domain/line/infrastructure/lineWebhookValidator`

**場所**: `shared/domain/line/infrastructure/lineWebhookValidator.ts`

**エクスポート**:
```typescript
export class LineWebhookValidator {
  static async validateWebhookRequest(
    request: Request,
    config: LineWebhookConfigVo
  ): Promise<{ event: LineWebhookEvent }>;
}

export function isTextMessageEvent(event: LineWebhookEvent): boolean;
export function isPostbackEvent(event: LineWebhookEvent): boolean;
```

**責務**:
- Webhook署名検証（HMAC-SHA256）
- イベント抽出
- イベントタイプ判定

**使用箇所**:
- [src/index.ts:2](../src/index.ts#L2) - インポート
- [src/index.ts:22](../src/index.ts#L22) - Webhook検証
- [src/index.ts:25](../src/index.ts#L25) - テキストメッセージ判定
- [src/index.ts:52](../src/index.ts#L52) - Postbackイベント判定

**例**:
```typescript
// Webhook検証
const { event } = await LineWebhookValidator.validateWebhookRequest(request, config);

// イベントタイプ判定
if (isTextMessageEvent(event)) {
  // テキストメッセージ処理
}

if (isPostbackEvent(event)) {
  // Postbackイベント処理
}
```

#### `@shared/domain/line/infrastructure/lineApiClient`

**場所**: `shared/domain/line/infrastructure/lineApiClient.ts`

**エクスポート**:
```typescript
export async function sendReplyToLine(
  replyToken: string,
  message: string,
  channelToken: string
): Promise<void>;

export async function sendPushMessage(
  userId: string,
  message: string,
  channelToken: string,
  quickReply?: object
): Promise<void>;
```

**責務**: LINE Messaging APIとの通信

**使用箇所**:
- [src/usecases/lineWebhookToReminderUsecase.ts:1](../src/usecases/lineWebhookToReminderUsecase.ts#L1) - リプライメッセージ送信
- [src/usecases/scheduledReminderUsecase.ts:1](../src/usecases/scheduledReminderUsecase.ts#L1) - プッシュメッセージ送信

**例**:
```typescript
// リプライメッセージ
await sendReplyToLine(
  replyToken,
  "✅ リマインド登録\n\n📝 水を飲む",
  env.LINE_CHANNEL_TOKEN
);

// プッシュメッセージ（クイックリプライ付き）
await sendPushMessage(
  userId,
  "🔔 リマインド [1日後]\n\n水を飲む",
  env.LINE_CHANNEL_TOKEN,
  {
    items: [{
      type: 'action',
      action: {
        type: 'postback',
        label: 'リマインド削除',
        data: `type=delete&groupId=${groupId}`,
      },
    }],
  }
);
```

---

### 4. Value Object (VO)

#### `@shared/domain/line/infrastructure/vo/LineWebhookConfigVo`

**場所**: `shared/domain/line/infrastructure/vo/LineWebhookConfigVo.ts`

**エクスポート**:
```typescript
export class LineWebhookConfigVo {
  static create(params: {
    channelSecret: string;
    channelToken: string;
    allowedUserId: string;
  }): LineWebhookConfigVo;

  channelSecret: string;
  channelToken: string;
  allowedUserId: string;
}
```

**責務**: Webhook設定を保持するValue Object

**使用箇所**:
- [src/index.ts:5](../src/index.ts#L5)

**例**:
```typescript
const config = LineWebhookConfigVo.create({
  channelSecret: env.LINE_CHANNEL_SECRET,
  channelToken: env.LINE_CHANNEL_TOKEN,
  allowedUserId: env.LINE_OWN_USER_ID,
});
```

#### `@shared/domain/line/infrastructure/vo/LineTextMessageEventVo`

**場所**: `shared/domain/line/infrastructure/vo/LineTextMessageEventVo.ts`

**エクスポート**:
```typescript
export class LineTextMessageEventVo {
  static create(params: {
    message: string;
    userId: string;
    replyToken: string;
  }): LineTextMessageEventVo;

  message: string;
  userId: string;
  replyToken: string;
}
```

**責務**: テキストメッセージイベントを表現するValue Object

**使用箇所**:
- [src/index.ts:4](../src/index.ts#L4)
- [src/index.ts:27](../src/index.ts#L27)

**例**:
```typescript
const messageEvent = LineTextMessageEventVo.create({
  message: event.message.text,
  userId: event.source?.userId,
  replyToken: event.replyToken,
});
```

#### `@shared/domain/line/infrastructure/vo/LinePostbackDeleteReminderEventVo`

**場所**: `shared/domain/line/infrastructure/vo/LinePostbackDeleteReminderEventVo.ts`

**エクスポート**:
```typescript
export class LinePostbackDeleteReminderEventVo {
  static create(params: {
    data: string;       // "type=delete&groupId=xxx"
    userId: string;
    replyToken: string;
  }): LinePostbackDeleteReminderEventVo;

  groupId: string;      // 抽出されたgroupId
  userId: string;
  replyToken: string;
}
```

**責務**: Postbackイベントから`groupId`を抽出するValue Object

**使用箇所**:
- [src/index.ts:3](../src/index.ts#L3)
- [src/index.ts:54](../src/index.ts#L54)

**例**:
```typescript
const postBackEvent = LinePostbackDeleteReminderEventVo.create({
  data: "type=delete&groupId=f47ac10b-58cc-4372-a567-0e02b2c3d479",
  userId: event.source?.userId,
  replyToken: event.replyToken,
});

console.log(postBackEvent.groupId); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

---

### 5. ユーティリティ

#### `@shared/utils/ServerErrorException`

**場所**: `shared/utils/ServerErrorException.ts`

**エクスポート**:
```typescript
export class ServerErrorException extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public errors: any[] = []
  );
}
```

**責務**: カスタムエラークラス（HTTPステータスコードとエラー詳細を保持）

**使用箇所**:
- [src/index.ts:6](../src/index.ts#L6)
- [src/index.ts:71](../src/index.ts#L71) - サポート外イベントエラー
- [src/index.ts:74](../src/index.ts#L74) - エラーハンドリング

**例**:
```typescript
throw new ServerErrorException('Unsupported event type', 400);

// エラーハンドリング
catch (error) {
  if (error instanceof ServerErrorException) {
    return new Response(
      JSON.stringify({
        message: error.message,
        errors: error.errors,
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

---

## 依存関係グラフ

```
line-reminder-bot
│
├─ src/index.ts
│   ├─ @shared/domain/line/application/checkUserAuthorization
│   ├─ @shared/domain/line/infrastructure/lineWebhookValidator
│   ├─ @shared/domain/line/infrastructure/vo/LinePostbackDeleteReminderEventVo
│   ├─ @shared/domain/line/infrastructure/vo/LineTextMessageEventVo
│   ├─ @shared/domain/line/infrastructure/vo/LineWebhookConfigVo
│   └─ @shared/utils/ServerErrorException
│
├─ src/types.ts
│   └─ @shared/domain/line/types
│
├─ src/usecases/lineWebhookToReminderUsecase.ts
│   └─ @shared/domain/line/infrastructure/lineApiClient
│
└─ src/usecases/scheduledReminderUsecase.ts
    └─ @shared/domain/line/infrastructure/lineApiClient
```

## 共有ライブラリのディレクトリ構造

```
shared/
├── domain/
│   └── line/
│       ├── types.ts
│       ├── application/
│       │   └── checkUserAuthorization.ts
│       └── infrastructure/
│           ├── lineApiClient.ts
│           ├── lineWebhookValidator.ts
│           └── vo/
│               ├── LineWebhookConfigVo.ts
│               ├── LineTextMessageEventVo.ts
│               └── LinePostbackDeleteReminderEventVo.ts
└── utils/
    └── ServerErrorException.ts
```

## 共有ライブラリの設計思想

### ドメイン駆動設計（DDD）

- **domain/line**: LINE関連のドメインロジック
- **application**: アプリケーション層（ユースケース横断的なロジック）
- **infrastructure**: インフラ層（外部API、バリデーション）
- **vo**: Value Object（不変オブジェクト）

### 再利用性

- LINE関連の共通ロジックを複数のボットプロジェクトで共有
- 例: `line-reminder-bot`, `line-memo-bot`など

### 関心の分離

- Webhook検証
- ユーザー認証
- LINE API通信
- イベントデータ変換

これらを独立したモジュールとして提供

## 外部依存関係

### LINE Messaging API

- **エンドポイント**:
  - `https://api.line.me/v2/bot/message/reply`
  - `https://api.line.me/v2/bot/message/push`
- **認証**: Bearer Token (`LINE_CHANNEL_TOKEN`)
- **署名検証**: HMAC-SHA256 (`LINE_CHANNEL_SECRET`)

### Cloudflare D1

- **バインディング**: `env.DB`
- **型**: `D1Database`
- **設定**: [wrangler.jsonc](../wrangler.jsonc#L9-L15)

## 注意点

### 1. パス解決の重要性

`tsconfig.json`の`paths`設定が正しくないと、ビルドエラーが発生します：
```json
{
  "paths": {
    "@shared/*": ["../../shared/*"]
  }
}
```

### 2. 共有ライブラリの変更影響

- `@shared`を変更すると、依存する全てのボットに影響
- 変更時は互換性を考慮する必要がある

### 3. 型の一貫性

- `LineWebhookEvent`など、共有型を使用することで型安全性を保証
- 各ボットで独自に型定義する必要がない

### 4. エラーハンドリングの統一

- `ServerErrorException`を使うことで、エラーレスポンスの形式を統一
- HTTPステータスコードとエラー詳細を一元管理
