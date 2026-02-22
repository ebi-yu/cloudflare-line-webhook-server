/**
 * リマインダーのControllerレイヤー
 * イベントデータのVO変換、ユーザー認証、Usecaseの呼び出し、LINE APIへの送信を担当
 */

import { checkUserAuthorization } from '@shared/domain/line/application/checkUserAuthorization';
import { sendReplyFlexMessage, sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { ButtonMenuFlexContainerVo, ButtonMenuItem, FlexBubble, FlexComponent, FlexContainer } from '@shared/domain/line/infrastructure/vo';
import { LinePostbackDeleteReminderVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackDeleteReminderVo';
import { LinePostbackShowReminderDetailVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackShowReminderDetailVo';
import { LinePostbackShowReminderListVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackShowReminderListVo';
import { LinePostbackEvent } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackVo';
import { LineWebhookConfigVo } from '@shared/domain/line/infrastructure/vo/webhook/LineWebhookConfigVo';
import { LineTextMessageEvent, LineWebhookMessageVo } from '@shared/domain/line/infrastructure/vo/webhook/LineWebhookMessageVo';
import { createReminder, CreateReminderResult } from '../usecases/createReminderUsecase';
import { deleteReminder } from '../usecases/deleteReminderUsecase';
import { getReminderDetail, ReminderDetail } from '../usecases/getReminderDetailUsecase';
import { getReminderList, ReminderListItem } from '../usecases/getRemindersListUsecase';

// ボタンラベルの最大文字数
const MAX_BUTTON_LABEL_LENGTH = 20;

/**
 * リマインダー作成のコントローラー
 */
export async function handleCreateReminder(vo: {
	event: LineTextMessageEvent;
	env: Record<string, any>;
	config: LineWebhookConfigVo;
}): Promise<void> {
	const { event, env, config } = vo;

	// VO変換（ドメインオブジェクトの作成）
	const messageEvent = LineWebhookMessageVo.create({
		message: event.message.text,
		userId: event.source?.userId,
		replyToken: event.replyToken,
	});

	// ユーザー認証（ビジネスルール）
	await checkUserAuthorization({
		userId: messageEvent.userId,
		replyToken: messageEvent.replyToken,
		config,
	});

	// Usecaseを実行（ビジネスロジック）
	const result = await createReminder({
		message: messageEvent.message,
		userId: messageEvent.userId,
		db: env.DB,
	});

	// 結果をLINE形式に整形して送信
	const responseMessage = formatCreateReminderResponse(result);
	await sendReplyTextMessage(messageEvent.replyToken, responseMessage, env.LINE_CHANNEL_TOKEN);
}

/**
 * リマインダー削除のコントローラー
 */
export async function handleDeleteReminder(vo: {
	event: LinePostbackEvent;
	env: Record<string, any>;
	config: LineWebhookConfigVo;
}): Promise<void> {
	const { event, env, config } = vo;

	// VO変換（ドメインオブジェクトの作成）
	const postBackEvent = LinePostbackDeleteReminderVo.create({
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
	await deleteReminder({
		groupId: postBackEvent.groupId,
		userId: postBackEvent.userId,
		db: env.DB,
	});

	// LINE APIに送信
	await sendReplyTextMessage(postBackEvent.replyToken, '✅ リマインドを削除しました。', env.LINE_CHANNEL_TOKEN);
}

/**
 * リマインダー詳細表示のコントローラー
 */
export async function handleShowReminderDetail(vo: {
	event: LinePostbackEvent;
	env: Record<string, any>;
	config: LineWebhookConfigVo;
}): Promise<void> {
	const { event, env, config } = vo;

	// VO変換（ドメインオブジェクトの作成）
	const postBackEvent = LinePostbackShowReminderDetailVo.create({
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
	const detail = await getReminderDetail({
		groupId: postBackEvent.groupId,
		userId: postBackEvent.userId,
		db: env.DB,
	});

	if (!detail) {
		await sendReplyTextMessage(postBackEvent.replyToken, 'リマインドが見つかりませんでした。', env.LINE_CHANNEL_TOKEN);
		return;
	}

	// Flexメッセージ形式に変換して送信
	const flexContainer = formatReminderDetailAsFlexContainer(detail);
	await sendReplyFlexMessage(postBackEvent.replyToken, 'リマインド詳細', flexContainer, env.LINE_CHANNEL_TOKEN);
}

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
 * リマインダー作成結果をLINEメッセージ形式に整形
 */
function formatCreateReminderResponse(result: CreateReminderResult): string {
	let message = '✅ リマインド登録\n\n';
	message += `📝 ${result.message}\n\n`;
	message += '📅 通知予定:\n';

	const formattedTimes = result.scheduledTimes.map((time) => {
		const dateStr = time.dateTime.toLocaleString('ja-JP', {
			timeZone: 'Asia/Tokyo',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
		return `・ ${time.label} (${dateStr})`;
	});

	message += formattedTimes.join('\n');

	return message;
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

/**
 * リマインダー詳細をFlexContainer形式に変換
 */
function formatReminderDetailAsFlexContainer(detail: ReminderDetail): FlexContainer {
	const bodyContents: FlexComponent[] = [
		{
			type: 'text',
			text: detail.message,
			weight: 'bold',
		},
		{ type: 'spacer', size: 'sm' },
	];

	detail.scheduledTimes.forEach((t) => {
		const dateStr = t.dateTime.toLocaleString('ja-JP', {
			timeZone: 'Asia/Tokyo',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
		bodyContents.push({
			type: 'text',
			text: `${t.label}: ${dateStr}`,
			size: 'sm',
		});
	});

	const bubble: FlexBubble = {
		type: 'bubble',
		body: {
			type: 'box',
			layout: 'vertical',
			contents: bodyContents,
		},
		footer: {
			type: 'box',
			layout: 'vertical',
			contents: [
				{
					type: 'button',
					action: {
						type: 'postback',
						label: '🗑 削除',
						data: `type=delete&groupId=${detail.groupId}`,
					},
					style: 'secondary',
				},
			],
		},
	};

	return bubble;
}
