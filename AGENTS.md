# 重要なルール

- infrastructure/usecase/voにコードを振り分けて実装する
  - `infrastructure`：外部サービスとのやりとりを担当するコード
  - `usecase`：ビジネスロジックを担当するコード
  - `vo`：値オブジェクト（Value Object）を定義するコード
  - `src/index.ts`：Cloudflare Workersのエントリーポイントとして機能する。リクエストパラメータのバリデーションとルーティングはここで行う

## エラー処理について

- `ServerErrorException`を使用してエラーをスローする
- new Responseは必ず、`src/index.ts`で行う。他の箇所でnew Responseを使用しないこと
- エラーのハンドリングは`src/index.ts`で行うこと
