import { sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { getRemindersByUserId } from '../infrastructure/reminderRepository';
import { Reminder } from '../types';

/**
 * リマインド一覧をLINEで返すユースケース
 */
export async function listRemindersForLine(vo: {
	userId: string;
	replyToken: string;
	env: Record<string, any>;
}): Promise<void> {
	const { userId, replyToken, env } = vo;

	// リマインダー一覧を取得
	const reminders = await getRemindersByUserId(env.DB, userId);

	if (reminders.length === 0) {
		await sendReplyTextMessage(replyToken, '📋 登録されているリマインドはありません', env.LINE_CHANNEL_TOKEN);
		return;
	}

	// グループ化して整形
	const message = formatRemindersMessage(reminders);

	await sendReplyTextMessage(replyToken, message, env.LINE_CHANNEL_TOKEN);
}

/**
 * リマインダー一覧をLINEメッセージ形式に整形
 */
function formatRemindersMessage(reminders: Reminder[]): string {
	// groupIdでグループ化
	const grouped = new Map<string, Reminder[]>();

	for (const reminder of reminders) {
		const key = reminder.groupId || reminder.id;
		if (!grouped.has(key)) {
			grouped.set(key, []);
		}
		grouped.get(key)!.push(reminder);
	}

	// グループごとに整形（最新10グループまで）
	const groups = Array.from(grouped.values()).slice(0, 10);
	let message = `📋 リマインド一覧 (${reminders.length}件)\n\n`;

	groups.forEach((group, index) => {
		// グループの最初のリマインダーからメッセージを取得
		const firstReminder = group[0];
		message += `${index + 1}. 📝 ${firstReminder.message}\n`;

		// グループ内の各リマインドを表示
		group.forEach((reminder) => {
			const dateStr = new Date(reminder.executionTime).toLocaleString('ja-JP', {
				timeZone: 'Asia/Tokyo',
				month: 'numeric',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
			const label = reminder.intervalLabel ? `${reminder.intervalLabel} ` : '';
			message += `   ・${label}(${dateStr})\n`;
		});

		message += '\n';
	});

	if (grouped.size > 10) {
		message += `他 ${grouped.size - 10} グループのリマインドがあります`;
	}

	return message.trim();
}
