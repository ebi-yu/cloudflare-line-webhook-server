import { D1Database } from "@cloudflare/workers-types/experimental";
import { getRemindersByUserId } from "../infrastructure/reminderRepository";

export interface ReminderListItem {
	id: string;
	groupId: string | undefined;
	message: string;
	executionTime: number;
}

/**
 * リマインダー一覧を取得するユースケース
 * ビジネスロジックのみを担当し、結果を返す
 */
export async function getReminderList(vo: {
	userId: string;
	db: D1Database;
}): Promise<ReminderListItem[]> {
	const { userId, db } = vo;
	const reminders = await getRemindersByUserId(db, userId);

	// 重複するgroupIdを除いた一覧を作成（executionTime昇順の最初のリマインドを代表として使用）
	const seen = new Set<string>();
	const uniqueReminders = reminders.filter((r) => {
		const key = r.groupId ?? r.id;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	return uniqueReminders.map((r) => ({
		id: r.id,
		groupId: r.groupId,
		message: r.message,
		executionTime: r.executionTime,
	}));
}
