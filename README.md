# Cloudflare LINE Webhook Server

Cloudflare Workers上で動作するLINE Bot のモノレポプロジェクトです。

## プロジェクト概要

このプロジェクトはpnpmモノレポ構成となっており、複数のLINE Botを含んでいます：

| Bot名               | 説明                                                                                     |
|--------------------|------------------------------------------------------------------------------------------|
| [line-memo-bot](packages/line-memo-bot/) | LINE Webhookからのメッセージを受け取り、GitHubリポジトリにマークダウンファイルとして保存するBot
| [line-reminder-bot](packages/line-reminder-bot/) | メッセージを送るだけで自動的にリマインドを設定できるBot（1日後、3日後、7日後、30日後に通知）
