import { D1Database } from '@cloudflare/workers-types/experimental';
import { deleteRemindersByGroupId } from '../infrastructure/reminderRepository';

/**
 * リマインダーを削除するユースケース
 * ビジネスロジックのみを担当
 */
export async function deleteReminder(vo: { groupId: string; userId: string; db: D1Database }): Promise<void> {
	const { groupId, userId, db } = vo;
	await deleteRemindersByGroupId(db, groupId, userId);
}
