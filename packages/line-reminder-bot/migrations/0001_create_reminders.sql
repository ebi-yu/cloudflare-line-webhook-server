-- リマインダーテーブル
CREATE TABLE IF NOT EXISTS reminders (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	message TEXT NOT NULL,
	execution_time INTEGER NOT NULL,
	created_at INTEGER NOT NULL
);

-- インデックス: ユーザーIDで検索
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- インデックス: 実行時刻で検索（スケジューラー用）
CREATE INDEX IF NOT EXISTS idx_reminders_execution_time ON reminders(execution_time);
