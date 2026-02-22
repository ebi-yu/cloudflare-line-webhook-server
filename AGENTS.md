# 前提

LINE BotからWebhookイベントを受け取り、処理を実行する

- DB : Cloudflare D1
- サーバ : Cloudflare Worker
- 言語 : Typescript
- アーキテクチャ : Domain Driven Design , TDD , Mono Repo
- タスク管理 : Vide Kanban

## サービス一覧

- line-remind-bot : LINE BotのWebhookイベントを受け取り、メッセージをCloudflare D1に保存し、指定した期間でリマインドする

## ドキュメント

### line-remind-bot

| ドキュメント | 説明 |
| --- | --- |
| [アーキテクチャドキュメント](./packages/line-reminder-bot/docs/architecture.md) | アーキテクチャの原則と各層の責務を記述 |
| [テスト戦略](./packages/line-reminder-bot/docs/testing-strategy.md) | テストの方針とテストレベルごとの戦略を記述 |
| [データベース設計](./packages/line-reminder-bot/docs/database-schema.md) | D1データベースのスキーマ設計とエンティティの関係を記述 |
| [ユーザーストーリー](./packages/line-reminder-bot/docs/user-story.md) | ユーザーストーリーとそれに対応する機能要件を記述 |

## 実装ルール

- **絶対にテストから実装すること（TDD）**。実装コードよりも先にテストコードを書くこと。
- テストを実装する際は、必ず [テスト戦略](./packages/line-reminder-bot/docs/testing-strategy.md) を読んでから実装すること。
