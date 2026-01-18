import { Reminder, ReminderInput } from '../types';

/**
 * リマインダーをデータベースに保存
 */
export async function createReminder(db: D1Database, userId: string, input: ReminderInput): Promise<Reminder> {
	const now = Date.now();
	const reminder: Reminder = {
		id: crypto.randomUUID(),
		userId,
		message: input.message,
		executionTime: input.executionTime,
		createdAt: now,
		groupId: input.groupId,
		intervalLabel: input.intervalLabel,
	};

	await db
		.prepare(
			`INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id, interval_label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			reminder.id,
			reminder.userId,
			reminder.message,
			reminder.executionTime,
			reminder.createdAt,
			reminder.groupId ?? null,
			reminder.intervalLabel ?? null
		)
		.run();

	return reminder;
}

/**
 * ユーザーのリマインダー一覧を取得
 */
export async function getRemindersByUserId(db: D1Database, userId: string): Promise<Reminder[]> {
	const result = await db.prepare(`SELECT * FROM reminders WHERE user_id = ? ORDER BY execution_time ASC`).bind(userId).all<Reminder>();

	return result.results || [];
}

/**
 * リマインダーを削除
 */
export async function deleteReminder(db: D1Database, id: string, userId: string): Promise<boolean> {
	const result = await db.prepare(`DELETE FROM reminders WHERE id = ? AND user_id = ?`).bind(id, userId).run();

	return result.success && (result.meta?.changes || 0) > 0;
}

/**
 * 実行すべきリマインダーを取得（現在時刻以前のもの）
 */
export async function getDueReminders(db: D1Database): Promise<Reminder[]> {
	const now = Date.now();
	const result = await db.prepare(`SELECT * FROM reminders WHERE execution_time <= ?`).bind(now).all<Reminder>();

	return result.results || [];
}
