# リマインド一覧機能 設計書

## 概要
ユーザーが現在登録しているリマインドの一覧を確認できる機能を実装する。

## 要件
- ユーザーが登録済みのリマインド一覧を取得できる
- LINEのメッセージで一覧を表示する
- 実行予定時刻順にソート表示する
- グループ化されたリマインド（同じメッセージの複数リマインド）を分かりやすく表示する

## 実装方針

### 1. トリガー方法
LINEのテキストメッセージで特定のコマンドを送信すると一覧を表示する。
- コマンド例: `一覧`, `リスト`, `list`

### 2. レスポンス形式
```
📋 リマインド一覧 (5件)

1. 📝 会議の準備
   ・5分後 (2/21 14:30)
   ・1日後 (2/22 14:25)
   ・3日後 (2/24 14:25)
   ・7日後 (2/28 14:25)
   ・30日後 (3/23 14:25)

2. 📝 買い物リスト
   ・1日後 (2/22 10:00)
   ・3日後 (2/24 10:00)
```

### 3. エッジケース
- リマインドが0件の場合: `📋 登録されているリマインドはありません`
- リマインドが多数ある場合: 最新10グループまで表示（LINEの文字数制限対応）

### 4. 実装箇所

#### 4.1 Repository層（既存）
`getRemindersByUserId` 関数は既に実装済み
- `src/infrastructure/reminderRepository.ts:55`

#### 4.2 Usecase層（新規）
新しいユースケース関数を追加
- ファイル: `src/usecases/listRemindersUsecase.ts`
- 関数: `listRemindersForLine`
- 責務:
  - リマインダー一覧を取得
  - グループ化して整形
  - LINEメッセージとして送信

#### 4.3 Entry Point層（修正）
`src/index.ts` でコマンドを検出して処理を振り分け
- テキストメッセージが「一覧」「リスト」「list」の場合に一覧表示処理を実行

## データフロー
```
LINE Message (一覧)
  → index.ts (イベント振り分け)
  → listRemindersUsecase.ts (一覧取得・整形)
  → reminderRepository.getRemindersByUserId (DB取得)
  → lineApiClient.sendReplyTextMessage (LINE返信)
```

## 実装ステップ
1. `src/usecases/listRemindersUsecase.ts` を作成
2. `src/index.ts` にコマンド判定ロジックを追加
3. 動作確認
