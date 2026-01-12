# LINE memo Bot

LINE Webhookからのメッセージを受け取り、GitHubリポジトリにマークダウンファイルとして保存するCloudflare Workersアプリケーションです。

## 機能

- LINE Webhookからのメッセージを受信
- 受信したメッセージをGitHubリポジトリに保存
- LINE Botからの応答（エコーバック）

## セットアップ

詳細なセットアップ手順については、[ルートのREADME](../../README.md)を参照してください。

## プロジェクト構成

```
src/
├── github/          # GitHub ドメイン
│   ├── github.ts    # GitHub API リクエスト
│   └── types.ts     # GitHub 関連の型定義
├── line/            # LINE ドメイン
│   ├── line.ts      # LINE Webhook の処理
│   └── types.ts     # LINE 関連の型定義
├── utils/           # ユーティリティ関数
│   ├── base64.ts    # Base64 エンコード/デコード
│   ├── env.ts       # 環境変数の取得
│   └── logger.ts    # ログ関連の関数
├── types.ts         # 共通の型定義
└── index.ts         # エントリーポイント
```

## ローカル開発

```bash
# このパッケージのディレクトリで
wrangler dev

# またはルートディレクトリから
pnpm --filter line-webhook-server dev
```

## デプロイ

```bash
# このパッケージのディレクトリで
wrangler deploy

# またはルートディレクトリから
pnpm --filter line-webhook-server deploy
```

## 環境変数

`.dev.vars`ファイルに以下の環境変数を設定する必要があります：

```env
GITHUB_TOKEN=your-github-personal-access-token
GITHUB_REPO_OWNER=your-github-username
GITHUB_REPO_NAME=your-repo-name
GITHUB_PUSH_DIRECTORY_PATH=path/to/directory

LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_TOKEN=your-line-channel-access-token
LINE_OWN_USER_ID=your-line-user-id

GITHUB_COMMITTER_NAME=your-name
GITHUB_COMMITTER_EMAIL=your-email@example.com
```

本番環境では、`wrangler secret put`コマンドを使用してシークレットを設定します。
