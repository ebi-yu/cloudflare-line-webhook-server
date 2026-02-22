import { sendReplyFlexMessage, sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { ButtonMenuFlexContainerVo, ButtonMenuItem } from '@shared/domain/line/infrastructure/vo';
import { getRemindersByUserId } from '../infrastructure/reminderRepository';

// ボタンラベルの最大文字数
const MAX_BUTTON_LABEL_LENGTH = 20;

/**
 * リマインダー一覧を表示するユースケース
 */
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
