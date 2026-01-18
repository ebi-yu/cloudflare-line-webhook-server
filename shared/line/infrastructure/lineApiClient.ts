import { ServerErrorException } from '../../utils/ServerErrorException';

/**
 * LINEのメッセージに返信
 */
export async function sendReplyToLine(replyToken: string, message: string, accessToken: string): Promise<void> {
	const response = await fetch('https://api.line.me/v2/bot/message/reply', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			replyToken,
			messages: [{ type: 'text', text: message }],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new ServerErrorException(`Failed to send reply: ${response.status} - ${errorText}`);
	}
}

/**
 * LINEにプッシュメッセージを送信
 */
export async function sendPushMessage(
	userId: string,
	message: string,
	accessToken: string,
	quickReply?: { items: { type: string; action: { type: string; label: string; data: string } }[] }
): Promise<void> {
	const response = await fetch('https://api.line.me/v2/bot/message/push', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			to: userId,
			messages: [{ type: 'text', text: message, quickReply }],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new ServerErrorException(`Failed to send push message: ${response.status} - ${errorText}`);
	}
}
