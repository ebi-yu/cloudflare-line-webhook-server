# ADR-003: index.tsの責務範囲

## ステータス

採用

## 決定日

2026-02-22

## 文脈

index.ts（Router/Handler層）がどこまでの処理を担当すべきか議論になりました。

特に以下の処理の配置について:

- Webhook設定の生成
- Webhook署名検証
- イベント解析
- ユーザー認証

## 決定

index.tsは以下の処理を担当します:

### 担当する処理

1. **HTTPリクエスト/レスポンスの処理**
   - リクエストの受け取り
   - レスポンスの返却
   - HTTPステータスコード

2. **Webhook設定の生成（環境変数から）**
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_TOKEN`
   - `LINE_OWN_USER_ID`

3. **Webhook署名検証**
   - `LineWebhookRequestVo.createFromRequest()`
   - セキュリティチェック

4. **リクエストボディのパース（イベント解析）**
   - JSONパース
   - イベントオブジェクトの抽出

5. **イベントタイプによるルーティング**
   - `isTextMessageEvent()`
   - `isPostbackEvent()`
   - 適切なControllerハンドラーへの振り分け

### 担当しない処理

1. **ドメインオブジェクト（Vo）の作成**
   - Controllerの責務

2. **ユーザー認証（ビジネスルール）**
   - Controllerの責務

3. **ビジネスロジックの実行**
   - Usecaseの責務

## 理由

### 1. Webhook検証はセキュリティに関わるインフラ処理

Webhook署名検証は、リクエストの信頼性を確保するセキュリティ処理です:

- 不正なリクエストを早期に弾く
- リクエストの送信元がLINE Platformであることを保証

セキュリティチェックは、リクエストを受け取った最初の段階（ゲートウェイ）で行うべきです。
後続の層（Controller、Usecase）は、検証済みのリクエストのみを受け取ります。

### 2. イベント解析はHTTPプロトコルのパース処理

イベント解析は、HTTPリクエストボディ（JSON）をパースする処理です:

- プロトコルレベルの処理
- ビジネスロジックではない
- ドメイン知識を必要としない

HTTPプロトコルに関する知識は、index.tsに閉じ込めるべきです。

### 3. ビジネスルールとしてのユーザー認証はControllerの責務

Webhook署名検証とユーザー認証は別物です:

| 処理            | 目的                                        | レイヤー               |
| --------------- | ------------------------------------------- | ---------------------- |
| Webhook署名検証 | リクエストがLINE Platformから来たことを保証 | index.ts（インフラ）   |
| ユーザー認証    | このユーザーがこの操作を許可されているか    | Controller（ビジネス） |

ユーザー認証は「誰がこの操作を許可されているか」というビジネスルールです。
ビジネスルールはビジネス層（Controller）の責務です。

### 4. ルーティングはインフラ処理

イベントタイプによるルーティングは、インフラ層の責務です:

- どのイベントをどのハンドラーに振り分けるか
- HTTPプロトコルレベルの処理
- ビジネスロジックではない

## 結果

### メリット

1. **責務の明確化**
   - インフラ処理（index.ts） vs ビジネス処理（Controller）の境界が明確

2. **セキュリティの早期適用**
   - 不正なリクエストを早期に弾く
   - 後続の層は検証済みリクエストのみを扱う

3. **index.tsを薄く保つ**
   - HTTPプロトコルのみに集中
   - ドメイン知識を持たない

4. **テストの分離**
   - index.ts: プロトコル処理のテスト
   - Controller: ビジネスルールのテスト

### デメリット

1. **index.tsでも一定の処理を持つ**
   - 完全に薄いルーターではない
   - しかし、インフラ処理として合理的な範囲

## 実装例

```typescript
// index.ts
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// 1. Webhook設定の生成（環境変数から）
		const config = LineWebhookConfigVo.create({
			channelSecret: env.LINE_CHANNEL_SECRET,
			channelToken: env.LINE_CHANNEL_TOKEN,
			allowedUserId: env.LINE_OWN_USER_ID,
		});

		// 2. Webhook検証とイベント解析
		const webhookRequest = await LineWebhookRequestVo.createFromRequest(request, config);
		const event = webhookRequest.event;

		// 3. イベントタイプによるルーティング
		if (LineWebhookRequestVo.isTextMessageEvent(event)) {
			await handleCreateReminder(event, config, env);
		} else if (LineWebhookRequestVo.isPostbackEvent(event)) {
			// ...
		}

		return new Response("OK", { status: 200 });
	},
};
```

## 参考資料

- [Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [Layered Architecture](https://herbertograca.com/2017/08/03/layered-architecture/)
