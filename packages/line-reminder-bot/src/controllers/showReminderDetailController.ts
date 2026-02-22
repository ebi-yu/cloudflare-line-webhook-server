/**
 * リマインダー詳細表示のコントローラー
 * イベントデータのVO変換、Usecaseの呼び出し、LINE APIへの送信を担当
 */

import { sendReplyFlexMessage, sendReplyTextMessage } from '@shared/domain/line/infrastructure/line-api-client/lineApiClient';
import { FlexBubble, FlexComponent, FlexContainer } from '@shared/domain/line/infrastructure/vo';
import { LinePostbackShowReminderDetailVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackShowReminderDetailVo';
import { LinePostbackEvent } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackVo';
import { getReminderDetail, ReminderDetail } from '../usecases/getReminderDetailUsecase';

/**
 * リマインダー詳細表示のコントローラー
 */
export async function handleShowReminderDetail(vo: {
	event: LinePostbackEvent;
	env: Record<string, any>;
}): Promise<void> {
	const { event, env } = vo;

	// VO変換（ドメインオブジェクトの作成）
	const postBackEvent = LinePostbackShowReminderDetailVo.create({
		data: event.postback.data,
		userId: event.source?.userId,
		replyToken: event.replyToken,
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
