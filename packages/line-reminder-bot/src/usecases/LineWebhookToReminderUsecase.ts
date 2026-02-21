import { sendReplyFlexMessage, sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { ButtonMenuFlexContainerVo, ButtonMenuItem } from '@shared/domain/line/infrastructure/vo';
import { createReminder, deleteRemindersByGroupId, getRemindersByUserId } from '../infrastructure/reminderRepository';
import { ReminderInput } from '../types';

// デフォルトのリマインド間隔（分単位）
const DEFAULT_REMINDER_INTERVALS = [
	{ minutes: 5, label: '5分後' },
	{ minutes: 1440, label: '1日後' }, // 24 * 60
	{ minutes: 4320, label: '3日後' }, // 3 * 24 * 60
	{ minutes: 10080, label: '7日後' }, // 7 * 24 * 60
	{ minutes: 43200, label: '30日後' }, // 30 * 24 * 60
];

// ボタンラベルの最大文字数
const MAX_BUTTON_LABEL_LENGTH = 20;

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

	await sendReplyTextMessage(replyToken, responseMessage, env.LINE_CHANNEL_TOKEN);
}

export async function showReminderListFromLine(vo: {
	userId: string;
	replyToken: string;
	env: Record<string, any>;
}): Promise<void> {
	const { userId, replyToken, env } = vo;
	const reminders = await getRemindersByUserId(env.DB, userId);

	if (reminders.length === 0) {
		await sendReplyTextMessage(replyToken, 'リマインドは登録されていません。', env.LINE_CHANNEL_TOKEN);
		return;
	}

	// 重複するgroupIdを除いた一覧を作成（executionTime昇順の最初のリマインドを代表として使用）
	const seen = new Set<string>();
	const uniqueReminders = reminders.filter((r) => {
		const key = r.groupId ?? r.id;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	const buttons: ButtonMenuItem[] = uniqueReminders.map((r) => ({
		label: r.message.length > MAX_BUTTON_LABEL_LENGTH ? r.message.substring(0, MAX_BUTTON_LABEL_LENGTH) : r.message,
		type: 'postback',
		data: `type=detail&groupId=${r.groupId ?? r.id}`,
	}));

	const flexContainer = ButtonMenuFlexContainerVo.create(buttons);
	await sendReplyFlexMessage(replyToken, 'リマインド一覧', flexContainer.container, env.LINE_CHANNEL_TOKEN);
}

export async function deleteReminderFromLine(vo: {
	groupId: string;
	userId: string;
	replyToken: string;
	env: Record<string, any>;
}): Promise<void> {
	const { groupId, userId, replyToken, env } = vo;

	await deleteRemindersByGroupId(env.DB, groupId, userId);

	await sendReplyTextMessage(replyToken, '✅ リマインドを削除しました。', env.LINE_CHANNEL_TOKEN);
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
