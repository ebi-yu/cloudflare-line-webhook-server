import { debug } from '../../utils/logger';

/**
 * LINEのメッセージに返信
 */
export async function sendReply(replyToken: string, message: string, accessToken: string): Promise<void> {
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
		throw new Error(`Failed to send reply: ${response.status} - ${errorText}`);
	}
}

/**
 * LINEにプッシュメッセージを送信
 */
export async function sendPushMessage(userId: string, message: string, accessToken: string): Promise<void> {
	const response = await fetch('https://api.line.me/v2/bot/message/push', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			to: userId,
			messages: [{ type: 'text', text: message }],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to send push message: ${response.status} - ${errorText}`);
	}
}

/**
 * LINE Webhookの署名を検証する
 */
export async function isValidSignature(bodyText: string, signature: string | null, secret: string): Promise<boolean> {
	if (!signature) return false;

	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

	// HMAC-SHA256 の署名を計算
	const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
	const hashArray = Array.from(new Uint8Array(signatureBytes));
	const computedSignature = btoa(String.fromCharCode(...hashArray)); // Base64 エンコード
	debug('Computed signature', computedSignature);
	return computedSignature === signature;
}
