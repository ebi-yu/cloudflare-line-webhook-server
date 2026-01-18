# LINE Reminder Bot

LINEを使ったリマインドボットです。メッセージを送るだけで自動的にリマインドを設定できます。

| 特徴 | 説明 |
|------|------|
| 超シンプル | メッセージを送るだけで自動的にリマインドを作成 |
| 5段階のリマインド | 30分後、1日後、3日後、7日後、30日後に自動通知 |
| 自動通知 | 設定した時刻にLINEにメッセージを送信 |
| グループ対応 | 個人チャットとグループチャットの両方に対応 |

## 使い方

メッセージを送るだけで、自動的に5つのリマインドが作成されます。

例: `水を飲む`

→  30分後、1日後、3日後、7日後、30日後にLINEでリマインド通知が届きます

## セットアップ手順

| ステップ | 説明 |
|----------|------|
| 1 | [Cloudflare Workersの作成](#1-cloudflare-workersの作成) |
| 2 | [LINE Developerの設定](#2-line-developerの設定) |
| 3 | [D1データベースの作成](#3-d1データベースの作成) |
| 4 | [環境変数の設定](#4-環境変数の設定) |
| 5 | [マイグレーションの実行](#5-マイグレーションの実行) |
| 6 | [デプロイ](#6-デプロイ) |
| 7 | [Webhook URLの設定](#7-webhook-urlの設定) |
| 8 | [Cronトリガーの設定](#8-cronトリガーの設定) |

### 1. Cloudflare Workersの作成

1. Cloudflareアカウントにログインします
2. Workersを選択し、「Create a Worker」をクリックします
3. 任意の名前を付けて作成します（例：line-reminder-bot）

### 2. LINE Developerの設定

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
   - 「Messaging API設定」タブで「Webhook設定」を開きます
   - 「Webhookの利用」をONにします
   - 「応答メッセージ」をOFFにします（Botによる自動応答を無効化）

### 3. D1データベースの作成

```bash
cd packages/line-reminder-bot
pnpm d1:create
```

出力された`database_id`を`wrangler.jsonc`の`database_id`に設定してください。

### 4. 環境変数の設定

以下の環境変数をCloudflare Workersのダッシュボードで設定します：

- `LINE_CHANNEL_TOKEN`: LINE Messaging APIのチャネルアクセストークン
- `LINE_CHANNEL_SECRET`: LINE Messaging APIのチャネルシークレット
- `LINE_OWN_USER_ID`: 許可するLINEユーザーID

または、`pnpm env:deploy`コマンドを使用して設定することもできます：

```bash
pnpm env:deploy
```

### 5. マイグレーションの実行

```bash
# ローカル環境（開発時）
pnpm d1:migrations:apply:local

# 本番環境（デプロイ前に必須）
pnpm d1:migrations:apply
```

### 6. デプロイ

```bash
# このパッケージのディレクトリで
cd packages/line-reminder-bot
wrangler deploy

# またはルートディレクトリから
pnpm --filter line-reminder-bot deploy
```

### 7. Webhook URLの設定

1. デプロイ後、Wranglerが表示するWorkerのURLをコピーします
2. LINE Developers Consoleに戻り、「Messaging API設定」タブを開きます
3. 「Webhook URL」に`https://your-worker-url.workers.dev/webhook`を入力します
4. 「検証」ボタンをクリックして、Webhookが正常に動作することを確認します

### 8. Cronトリガーの設定

このBotは定期的にリマインド通知を送信するために、Cloudflare Workersのcronトリガーを使用します。`wrangler.jsonc`に以下のように設定されています：

```jsonc
{
  "triggers": {
    "crons": ["0 * * * *"]  // 毎時0分に実行
  }
}
```

デプロイすると自動的にcronトリガーが設定されます。
