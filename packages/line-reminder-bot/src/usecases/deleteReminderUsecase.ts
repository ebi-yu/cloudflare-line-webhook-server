import { sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { deleteRemindersByGroupId } from '../infrastructure/reminderRepository';

/**
 * リマインダーを削除するユースケース
 */
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
