# ADR-002: Vo作成の位置

## ステータス

採用

## 決定日

2026-02-22

## 文脈

`LineWebhookMessageVo.create(...)`をどこで実行すべきか議論になりました。

### 選択肢

#### 選択肢1: index.ts（ルーター層）で実行

```typescript
// index.ts
const messageEvent = LineWebhookMessageVo.create({
	message: event.message!.text,
	userId: event.source?.userId,
	replyToken: event.replyToken,
});

// 型安全なオブジェクトとしてControllerに渡す
await handleCreateReminder(messageEvent, config, env);
```

**理由:**

- HTTPリクエストの形式検証として捉える
- 必須フィールドの存在確認
- 型の正規化
- 「リクエストが正しい形か」の検証

#### 選択肢2: Controller（ビジネス層）で実行

```typescript
// index.ts
// 生のイベントオブジェクトをControllerに渡す
await handleCreateReminder(event, config, env);

// Controller
const messageEvent = LineWebhookMessageVo.create({
	message: event.message!.text,
	userId: event.source?.userId,
	replyToken: event.replyToken,
});
```

**理由:**

- Voはドメインオブジェクト
- ドメインオブジェクトの生成はビジネス層の責務
- 「ビジネスで扱える形に変換」

## 決定

**選択肢2: Controller側でVo作成を実行する**

## 理由

### 1. index.tsをHTTPプロトコル処理のみに限定

index.tsはHTTPプロトコルレベルの処理のみを担当すべきです:

- リクエストの受け取り
- Webhook署名検証
- イベント解析（JSONパース）
- ルーティング

ドメインオブジェクト（Vo）への変換はプロトコル処理ではなく、ドメイン層の責務です。

### 2. Voはドメインオブジェクト

`LineWebhookMessageVo`は単なるデータ転送オブジェクト（DTO）ではなく、ドメインモデルの一部です:

- バリデーションルールを含む
- ドメイン知識を持つ
- ビジネス層で扱うオブジェクト

ドメインオブジェクトの生成は、ドメイン層（Controller以降）の責務です。

### 3. LINE Messaging APIの知識をController以降に局所化

Voの作成には、LINE Messaging APIの知識が必要です:

- どのフィールドが必須か
- どのフィールド名を使うか
- どのようにデータを抽出するか

この知識をindex.tsに持たせると、index.tsがLINE固有のプロトコルに依存してしまいます。
Controller以降に局所化することで、index.tsをプラットフォーム非依存に保てます。

### 4. テストしやすい

Controllerのテストで、Vo生成のテストもカバーできます:

- Vo生成のバリデーションエラー
- 必須フィールドの欠落
- 不正なデータ形式

index.ts側でVoを作成すると、これらのテストケースがindex.tsのテストに混入してしまいます。

### 5. 将来の拡張性

将来、Slack等の別のイベントソースを追加する際:

- index.tsは変更不要（ルーティングの追加のみ）
- 各プラットフォーム固有のControllerでVoを作成

index.ts側でVoを作成すると、プラットフォームごとにindex.tsを変更する必要が出てきます。

## 結果

### メリット

1. **index.tsがシンプル**: HTTPプロトコル処理のみに集中
2. **ドメイン知識の局所化**: LINE固有の知識がController以降に閉じる
3. **テストの分離**: Vo生成のテストがControllerに集約
4. **拡張性**: 新しいプラットフォームの追加が容易

### デメリット

1. **Controllerの責務が増える**: しかし、ドメイン層として適切な責務の範囲内
2. **index.tsから渡されるオブジェクトの型安全性が低下**: 生のイベントオブジェクトを渡すため
   - しかし、TypeScriptの型システムで十分にカバー可能

## 影響

- index.tsは生のイベントオブジェクト（`MessageEvent`等）をControllerに渡す
- Controllerがドメインオブジェクト（Vo）への変換を担当
- Usecaseはドメインオブジェクトのみを受け取る

## 参考資料

- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Value Objects](https://martinfowler.com/bliki/ValueObject.html)
