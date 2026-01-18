-- リマインダーグループを識別するためのカラムを追加
ALTER TABLE reminders ADD COLUMN group_id TEXT;
ALTER TABLE reminders ADD COLUMN interval_label TEXT;

-- インデックス: グループIDで検索
CREATE INDEX IF NOT EXISTS idx_reminders_group_id ON reminders(group_id);
