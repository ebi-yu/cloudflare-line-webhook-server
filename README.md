# Cloudflare LINE Webhook Server

LINE Webhookからのメッセージを受け取り、GitHubリポジトリにマークダウンファイルとして保存するCloudflare Workersアプリケーションです。

## 機能

- LINE Webhookからのメッセージを受信
- 受信したメッセージをGitHubリポジトリに保存
- LINE Botからの応答（エコーバック）

## セットアップ手順

### 前提条件

- [Node.js](https://nodejs.org/) (v16以上)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)
- [GitHubアカウント](https://github.com/signup)

### 1. GitHubアカウントとパーソナルアクセストークンの発行

1. [GitHub](https://github.com/)にアクセスし、ログインします
2. 右上のプロフィールアイコンをクリックし、「Settings」を選択します
3. 左側のメニューから「Developer settings」を選択します
4. 「Personal access tokens」→「Fine-grained Tokens」を選択します
5. 「Generate new token」をクリックします
6. トークンの説明を入力し、以下の権限を選択します：
     - "Contents" repository permissions (write)
     - "Contents" repository permissions (write) and "Workflows" repository permissions (write)
7. 「Generate token」をクリックします
8. 生成されたトークンをコピーして安全な場所に保存します（このトークンは一度しか表示されません）

### 2. Cloudflare Workersの作成

1. Cloudflareアカウントにログインします
2. Workersを選択し、「Create a Worker」をクリックします
3. 任意の名前を付けて作成します（例：line-webhook-server）
4. このリポジトリをクローンします：

```bash
git clone https://github.com/yourusername/cloudflare-line-webhook-server.git
cd cloudflare-line-webhook-server
```

5. 依存関係をインストールします：

```bash
npm install
```

### 3. LINE Developerの設定

#### LINE Developersアカウントの作成

1. [LINE Developers](https://developers.line.biz/ja/)にアクセスします
2. 「ログイン」をクリックし、LINEアカウントでログインします
3. ログイン後、「コンソール」をクリックします

#### Messaging APIチャネルの作成

1. [LINE Developers Console](https://developers.line.biz/console/)にログインします
2. 「プロバイダー」を作成します：
   - 「新規プロバイダー作成」をクリックします
   - プロバイダー名を入力し、「確認」→「作成」をクリックします
3. 作成したプロバイダーを選択し、「チャネル」を作成します：
   - 「新規チャネル作成」をクリックします
   - 「Messaging API」を選択します
   - 必要な情報を入力し、「作成」をクリックします
4. 以下の情報を取得します：
   - 「チャネル基本設定」タブから「チャネルシークレット」をコピーします
   - 「Messaging API設定」タブから「チャネルアクセストークン（長期）」を発行し、コピーします
   - あなた自身のLINE User ID（「Messaging API設定」タブの「応答メッセージ」セクションにあります）
5. Webhook URLを設定します（後でCloudflare Workersのデプロイ後に取得するURL）
6. Webhook送信を有効にします：
   - 「Messaging API設定」タブの「Webhook設定」セクションで「Webhook URL」を入力します
   - 「Webhook送信」を「オン」に設定します
   - 「検証」ボタンをクリックして、Webhookの接続を確認します

### 4. wrangler.jsoncの設定

wrangler.jsonc ファイルを編集して、以下の環境変数を設定します：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "your-worker-name",
  "main": "src/index.ts",
  "compatibility_date": "2025-03-13",
  "observability": {
    "enabled": true
  },
  "vars": {
    "GITHUB_REPO_OWNER": "your-github-username",
    "GITHUB_REPO_NAME": "your-repo-name",
    "GITHUB_PUSH_DIRECTORY_PATH": "path/to/directory",
    "GITHUB_COMMITTER_EMAIL":"github_commit_email",
    "GITHUB_COMMITTER_NAME":"github_committer_name"
  }
}
```

### 5. Cloudflare Workersへのシークレット設定

以下のコマンドを実行して、シークレット情報を設定します：

```bash
# GitHub トークン
wrangler secret put GITHUB_TOKEN

# LINE チャンネルシークレット
wrangler secret put LINE_CHANNEL_SECRET

# LINE チャンネルトークン
wrangler secret put LINE_CHANNEL_TOKEN

# LINE ユーザーID（LINE Developers Consoleから取得）
wrangler secret put LINE_OWN_USER_ID
```

### 6. ローカルでの起動

開発環境でテストするには、`.dev.vars`ファイルを作成し、以下の内容を設定します：

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

ローカル開発サーバーを起動します：

```bash
npm run dev
```

これにより、ローカルでWorkersが起動し、`http://localhost:8787`でアクセスできます。

### 7. デプロイ

Cloudflare Workersにデプロイするには：

```bash
npm run deploy
```

デプロイが完了すると、Workersのエンドポイントが表示されます（例：`https://your-worker-name.your-subdomain.workers.dev`）。

このURLをLINE DevelopersコンソールのWebhook URLとして設定します。

## 使用方法

1. LINE公式アカウントを友達に追加します
2. メッセージを送信します
3. メッセージがGitHubリポジトリに保存され、LINEでエコーバックされます

## プロジェクト構成

```md
src/
├── handlers/        # 各種イベントハンドラー
│   ├── github.ts    # GitHub API リクエスト
│   ├── line.ts      # LINE Webhook の処理
│   ├── webhook.ts   # メインの Webhook 処理
├── utils/           # ユーティリティ関数
│   ├── base64.ts    # Base64 エンコード/デコード
│   ├── env.ts       # 環境変数の取得
│   ├── logger.ts    # ログ関連の関数
├── types/           # 型定義
│   ├── github.ts    # GitHub API 用の型
│   ├── line.ts      # LINE Webhook 用の型
│   ├── index.ts     # 共通の型
├── index.ts         # エントリーポイント
```

## トラブルシューティング

- Webhook URLの検証に失敗する場合は、LINE Developersコンソールで「Use webhook」が有効になっていることを確認してください
- GitHubへのファイル作成に失敗する場合は、GitHubトークンの権限を確認してください。以下の権限が必要です。
  - "Contents" repository permissions (write)
  - "Contents" repository permissions (write) and "Workflows" repository permissions (write)
- ローカルでのテスト時は、ngrokなどのツールを使用してWebhookをローカル環境に転送することができます

## ライセンス

MIT
