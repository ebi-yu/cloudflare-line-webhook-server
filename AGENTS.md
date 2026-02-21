# 前提

LINE BotからWebhookイベントを受け取り、処理を実行する

- DB : Cloudflare D1
- サーバ : Cloudflare Worker
- 言語 : Typescript
- アーキテクチャ : Domain Driven Design , TDD , Mono Repo
- タスク管理 : Vide Kanban

## サービス一覧

- line-memo-bot : LINE BotのWebhookイベントを受け取り、メッセージをGithubの特定のリポジトリに保存する
- line-remind-bot : LINE BotのWebhookイベントを受け取り、メッセージをCloudflare D1に保存し、指定した期間でリマインドする
