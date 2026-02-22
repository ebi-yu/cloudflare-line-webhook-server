/**
 * リマインダー削除のコントローラー
 * イベントデータのVO変換、Usecaseの呼び出し、LINE APIへの送信を担当
 */

import { sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { LinePostbackDeleteReminderVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackDeleteReminderVo';
import { LinePostbackEvent } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackVo';
import { deleteReminder } from '../usecases/deleteReminderUsecase';

/**
 * リマインダー削除のコントローラー
 */
export async function handleDeleteReminder(vo: {
	event: LinePostbackEvent;
	env: Record<string, any>;
}): Promise<void> {
	const { event, env } = vo;

	// VO変換（ドメインオブジェクトの作成）
	const postBackEvent = LinePostbackDeleteReminderVo.create({
		data: event.postback.data,
		userId: event.source?.userId,
		replyToken: event.replyToken,
	});

	// Usecaseを実行（ビジネスロジック）
	await deleteReminder({
		groupId: postBackEvent.groupId,
		userId: postBackEvent.userId,
		db: env.DB,
	});

	// LINE APIに送信
	await sendReplyTextMessage(postBackEvent.replyToken, '✅ リマインドを削除しました。', env.LINE_CHANNEL_TOKEN);
}
