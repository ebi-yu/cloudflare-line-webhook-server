/**
 * リマインダー一覧表示のコントローラー
 * イベントデータのVO変換、ユーザー認証、Usecaseの呼び出し、LINE APIへの送信を担当
 */

import { checkUserAuthorization } from '@shared/domain/line/application/checkUserAuthorization';
import { sendReplyFlexMessage, sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { ButtonMenuFlexContainerVo, ButtonMenuItem } from '@shared/domain/line/infrastructure/vo';
import { LinePostbackShowReminderListVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackShowReminderListVo';
import { LinePostbackEvent } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackVo';
import { LineWebhookConfigVo } from '@shared/domain/line/infrastructure/vo/webhook/LineWebhookConfigVo';
import { getReminderList, ReminderListItem } from '../usecases/getRemindersListUsecase';

// ボタンラベルの最大文字数
const MAX_BUTTON_LABEL_LENGTH = 20;

/**
 * リマインダー一覧表示のコントローラー
 */
export async function handleGetReminderList(vo: {
	event: LinePostbackEvent;
	env: Record<string, any>;
	config: LineWebhookConfigVo;
}): Promise<void> {
	const { event, env, config } = vo;

	// VO変換（ドメインオブジェクトの作成）
	const postBackEvent = LinePostbackShowReminderListVo.create({
		data: event.postback.data,
		userId: event.source?.userId,
		replyToken: event.replyToken,
	});

	// ユーザー認証（ビジネスルール）
	await checkUserAuthorization({
		userId: postBackEvent.userId,
		replyToken: postBackEvent.replyToken,
		config,
	});

	// Usecaseを実行（ビジネスロジック）
	const reminders = await getReminderList({
		userId: postBackEvent.userId,
		db: env.DB,
	});

	// 結果に応じてLINE APIに送信
	if (reminders.length === 0) {
		await sendReplyTextMessage(postBackEvent.replyToken, 'リマインドは登録されていません。', env.LINE_CHANNEL_TOKEN);
		return;
	}

	// Flexメッセージ形式に変換して送信
	const buttons = formatRemindersAsButtons(reminders);
	const flexContainer = ButtonMenuFlexContainerVo.create(buttons);
	await sendReplyFlexMessage(postBackEvent.replyToken, 'リマインド一覧', flexContainer.container, env.LINE_CHANNEL_TOKEN);
}

/**
 * リマインダー一覧をボタン形式に変換
 */
function formatRemindersAsButtons(reminders: ReminderListItem[]): ButtonMenuItem[] {
	return reminders.map((r) => ({
		label: r.message.length > MAX_BUTTON_LABEL_LENGTH ? r.message.substring(0, MAX_BUTTON_LABEL_LENGTH) : r.message,
		type: 'postback',
		data: `type=detail&groupId=${r.groupId ?? r.id}`,
	}));
}
