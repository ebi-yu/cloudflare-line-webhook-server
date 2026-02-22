/**
 * リマインダー作成のコントローラー
 * イベントデータのVO変換、Usecaseの呼び出し、LINE APIへの送信を担当
 */

import { sendReplyTextMessage } from "@shared/domain/line/infrastructure/line-api-client/lineApiClient";
import {
	LineTextMessageEvent,
	LineWebhookMessageVo,
} from "@shared/domain/line/infrastructure/vo/webhook/LineWebhookMessageVo";
import { createReminder, CreateReminderResult } from "../usecases/createReminderUsecase";

/**
 * リマインダー作成のコントローラー
 */
export async function handleCreateReminder(vo: {
	event: LineTextMessageEvent;
	env: Record<string, any>;
}): Promise<void> {
	const { event, env } = vo;

	// VO変換（ドメインオブジェクトの作成）
	const messageEvent = LineWebhookMessageVo.create({
		message: event.message.text,
		userId: event.source?.userId,
		replyToken: event.replyToken,
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
 * リマインダー作成結果をLINEメッセージ形式に整形
 */
function formatCreateReminderResponse(result: CreateReminderResult): string {
	let message = "✅ リマインド登録\n\n";
	message += `📝 ${result.message}\n\n`;
	message += "📅 通知予定:\n";

	const formattedTimes = result.scheduledTimes.map((time) => {
		const dateStr = time.dateTime.toLocaleString("ja-JP", {
			timeZone: "Asia/Tokyo",
			month: "numeric",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
		return `・ ${time.label} (${dateStr})`;
	});

	message += formattedTimes.join("\n");

	return message;
}
