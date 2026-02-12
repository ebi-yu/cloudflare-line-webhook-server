import { sendReplyToLine } from '@shared/domain/line/infrastructure/lineApiClient';
import { createReminder, deleteRemindersByGroupId } from '../infrastructure/reminderRepository';
import { ReminderInput } from '../types';

// デフォルトのリマインド間隔（分単位）
const DEFAULT_REMINDER_INTERVALS = [
	{ minutes: 5, label: '5分後' },
	{ minutes: 1440, label: '1日後' }, // 24 * 60
	{ minutes: 4320, label: '3日後' }, // 3 * 24 * 60
	{ minutes: 10080, label: '7日後' }, // 7 * 24 * 60
	{ minutes: 43200, label: '30日後' }, // 30 * 24 * 60
];

/**
 * LINE Webhookを処理するユースケース
 */
export async function createReminderFromLine(vo: {
	message: string;
	userId: string;
	replyToken: string;
	env: Record<string, any>;
}): Promise<void> {
	const { message, userId, replyToken, env } = vo;
	const { trimmed, results } = await saveReminderToDB({ message, userId, env });

	let responseMessage = '✅ リマインド登録\n\n';
	responseMessage += `📝 ${trimmed}\n\n`;
	responseMessage += '📅 通知予定:\n';
	responseMessage += results.map((r) => `・ ${r}`).join('\n');

	await sendReplyToLine(replyToken, responseMessage, env.LINE_CHANNEL_TOKEN);
}

export async function deleteReminderFromLine(vo: {
	groupId: string;
	userId: string;
	replyToken: string;
	env: Record<string, any>;
}): Promise<void> {
	const { groupId, userId, replyToken, env } = vo;

	await deleteRemindersByGroupId(env.DB, groupId, userId);

	await sendReplyToLine(replyToken, '✅ リマインドを削除しました。', env.LINE_CHANNEL_TOKEN);
}

/**
 * LINEメッセージをリマインドとして登録
 * 1分、1日、3日、7日、30日後にそれぞれリマインドを作成
 */
async function saveReminderToDB(vo: {
	message: string;
	userId: string;
	env: Record<string, any>;
}): Promise<{ trimmed: string; results: string[] }> {
	const { message, userId, env } = vo;
	const trimmed = message.trim();

	const now = Date.now();
	const results: string[] = [];
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

		await createReminder(env.DB, userId, input);
		const dateStr = new Date(executionTime).toLocaleString('ja-JP', {
			timeZone: 'Asia/Tokyo',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
		results.push(`${interval.label} (${dateStr})`);
	}

	return { trimmed, results };
}
