import { D1Database } from "@cloudflare/workers-types/experimental";
import {
	deleteReminder as deleteReminderByIdFromRepo,
	deleteRemindersByGroupId,
} from "../infrastructure/reminderRepository";

/**
 * リマインダーを削除するユースケース
 * ビジネスロジックのみを担当
 */
export async function deleteReminder(vo: {
	groupId: string;
	userId: string;
	db: D1Database;
}): Promise<void> {
	const { groupId, userId, db } = vo;
	await deleteRemindersByGroupId(db, groupId, userId);
}

/**
 * リマインダーを1件個別に削除するユースケース
 * スケジュール実行時に発火したリマインダーを個別删除する際に使用
 */
export async function deleteReminderById(vo: {
	id: string;
	userId: string;
	db: D1Database;
}): Promise<boolean> {
	const { id, userId, db } = vo;
	return deleteReminderByIdFromRepo(db, id, userId);
}
