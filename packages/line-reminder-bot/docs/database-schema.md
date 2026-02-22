# データベーススキーマ

## 概要

LINE Reminder Botは、Cloudflare D1（SQLite）を使用してリマインダーを永続化します。シンプルな単一テーブル構成で、必要最小限のカラムとインデックスで構成されています。

## テーブル定義

### reminders テーブル

リマインダー情報を保存するメインテーブル。

| カラム名         | 型      | 制約        | 説明                                           |
| ---------------- | ------- | ----------- | ---------------------------------------------- |
| `id`             | TEXT    | PRIMARY KEY | リマインダーID（UUID）                         |
| `user_id`        | TEXT    | NOT NULL    | LINEユーザーID                                 |
| `message`        | TEXT    | NOT NULL    | リマインドメッセージ内容                       |
| `execution_time` | INTEGER | NOT NULL    | 実行時刻（Unix timestamp in milliseconds）     |
| `created_at`     | INTEGER | NOT NULL    | 作成日時（Unix timestamp in milliseconds）     |
| `group_id`       | TEXT    | NULLABLE    | リマインダーグループID（UUID）                 |
| `interval_label` | TEXT    | NULLABLE    | リマインド間隔のラベル（例: '5分後', '1日後'） |
