import { Reminder, ReminderInput } from '../types';

/**
 * D1の結果（スネークケース）をReminderオブジェクト（キャメルケース）に変換
 */
function mapDbRowToReminder(row: any): Reminder {
	return {
		id: row.id,
		userId: row.user_id,
		message: row.message,
		executionTime: row.execution_time,
		createdAt: row.created_at,
		groupId: row.group_id,
		intervalLabel: row.interval_label,
	};
}

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
	const result = await db.prepare(`SELECT * FROM reminders WHERE user_id = ? ORDER BY execution_time ASC`).bind(userId).all();

	return (result.results || []).map(mapDbRowToReminder);
}

/**
 * リマインダーを削除
 */
export async function deleteReminder(db: D1Database, id: string, userId: string): Promise<boolean> {
	const result = await db.prepare(`DELETE FROM reminders WHERE id = ? AND user_id = ?`).bind(id, userId).run();

	return result.success && (result.meta?.changes || 0) > 0;
}

export async function deleteRemindersByGroupId(db: D1Database, groupId: string, userId: string): Promise<number> {
	const result = await db.prepare(`DELETE FROM reminders WHERE group_id = ? AND user_id = ?`).bind(groupId, userId).run();

	return result.meta?.changes || 0;
}

/**
 * 実行すべきリマインダーを取得（現在時刻以前のもの）
 */
export async function getDueReminders(db: D1Database): Promise<Reminder[]> {
	const now = Date.now();
	const result = await db.prepare(`SELECT * FROM reminders WHERE execution_time <= ?`).bind(now).all();

	return (result.results || []).map(mapDbRowToReminder);
}
