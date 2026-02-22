import { D1Database } from "@cloudflare/workers-types/experimental";
import { saveReminder } from "../infrastructure/reminderRepository";
import { ReminderInput } from "../types";

// デフォルトのリマインド間隔（分単位）
const DEFAULT_REMINDER_INTERVALS = [
	{ minutes: 5, label: "5分後" },
	{ minutes: 1440, label: "1日後" }, // 24 * 60
	{ minutes: 4320, label: "3日後" }, // 3 * 24 * 60
	{ minutes: 10080, label: "7日後" }, // 7 * 24 * 60
	{ minutes: 43200, label: "30日後" }, // 30 * 24 * 60
];

export interface CreateReminderResult {
	message: string;
	scheduledTimes: Array<{
		label: string;
		dateTime: Date;
	}>;
}

/**
 * リマインダーを作成するユースケース
 * ビジネスロジックのみを担当し、結果を返す
 */
export async function createReminder(vo: {
	message: string;
	userId: string;
	db: D1Database;
}): Promise<CreateReminderResult> {
	const { message, userId, db } = vo;
	const trimmed = message.trim();

	const now = Date.now();
	const scheduledTimes: CreateReminderResult["scheduledTimes"] = [];
	const groupId = crypto.randomUUID(); // 同じメッセージの複数リマインドをグループ化

	// 各間隔でリマインドを作成
	for (const interval of DEFAULT_REMINDER_INTERVALS) {
		const executionTime = now + interval.minutes * 60 * 1000;
		const input: ReminderInput = {
			message: trimmed,
			executionTime,
			intervalLabel: interval.label,
			groupId,
		};

		await saveReminder(db, userId, input);
		scheduledTimes.push({
			label: interval.label,
			dateTime: new Date(executionTime),
		});
	}

	return {
		message: trimmed,
		scheduledTimes,
	};
}
