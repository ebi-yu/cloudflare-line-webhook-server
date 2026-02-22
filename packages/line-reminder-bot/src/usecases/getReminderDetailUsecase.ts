import { D1Database } from '@cloudflare/workers-types/experimental';
import { getRemindersByGroupId } from '../infrastructure/reminderRepository';

export interface ReminderDetail {
	groupId: string;
	message: string;
	scheduledTimes: { label: string; dateTime: Date }[];
}

/**
 * リマインダー詳細を取得するユースケース
 * ビジネスロジックのみを担当し、結果を返す
 */
export async function getReminderDetail(vo: { groupId: string; userId: string; db: D1Database }): Promise<ReminderDetail | null> {
	const { groupId, userId, db } = vo;
	const reminders = await getRemindersByGroupId(db, groupId, userId);

	if (reminders.length === 0) {
		return null;
	}

	const first = reminders[0];
	return {
		groupId,
		message: first.message,
		scheduledTimes: reminders.map((r) => ({
			label: r.intervalLabel ?? '',
			dateTime: new Date(r.executionTime),
		})),
	};
}
