/**
 * リマインダーのPresenterレイヤー
 * UsecaseやRepositoryの結果をLINE APIの送信形式に整形する責務を担う
 */

import { ButtonMenuItem, FlexBubble, FlexComponent, FlexContainer } from '@shared/domain/line/infrastructure/vo';
import { CreateReminderResult } from '../usecases/createReminderUsecase';
import { ReminderDetail } from '../usecases/getReminderDetailUsecase';
import { ReminderListItem } from '../usecases/getRemindersListUsecase';

// ボタンラベルの最大文字数
const MAX_BUTTON_LABEL_LENGTH = 20;

/**
 * リマインダー作成結果をLINEメッセージ形式に整形
 */
export function formatCreateReminderResponse(result: CreateReminderResult): string {
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
export function formatRemindersAsButtons(reminders: ReminderListItem[]): ButtonMenuItem[] {
	return reminders.map((r) => ({
		label: r.message.length > MAX_BUTTON_LABEL_LENGTH ? r.message.substring(0, MAX_BUTTON_LABEL_LENGTH) : r.message,
		type: 'postback',
		data: `type=detail&groupId=${r.groupId ?? r.id}`,
	}));
}

/**
 * リマインダー詳細をFlexContainer形式に変換
 */
export function formatReminderDetailAsFlexContainer(detail: ReminderDetail): FlexContainer {
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
