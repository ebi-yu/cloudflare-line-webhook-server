import { LineWebhookEvent } from '../types';
import { LineMessageEvent, LineMessageEventError } from '../vo/LineMessageEvent';
import { LineWebhookConfig } from '../vo/LineWebhookConfig';
import { isValidSignature, sendReply } from './lineApiclient';

/**
 * LINE Webhookのバリデーション処理
 * バリデーション済みのイベントデータを返すか、エラーレスポンスを返す
 */
export async function validateLineWebhook(
	request: Request,
	config: LineWebhookConfig
): Promise<{ success: true; event: LineMessageEvent } | { success: false; response: Response }> {
	if (request.method !== 'POST') {
		return { success: false, response: new Response('Method Not Allowed', { status: 405 }) };
	}

	const bodyText = await request.text();
	const signature = request.headers.get('x-line-signature');

	// 署名検証
	if (!(await isValidSignature(bodyText, signature, config.channelSecret))) {
		return { success: false, response: new Response('Invalid signature', { status: 401 }) };
	}

	const body: LineWebhookEvent = JSON.parse(bodyText);
	const event = body.events?.[0];

	if (!event) {
		return { success: false, response: new Response('No events', { status: 400 }) };
	}

	// メッセージイベントのみ処理
	if (event.type !== 'message' || event.message?.type !== 'text') {
		return { success: false, response: new Response('OK', { status: 200 }) };
	}

	const message = event.message.text;
	const userId = event.source?.userId;
	const replyToken = event.replyToken;

	// LineMessageEventのVOを作成
	let validatedEvent: LineMessageEvent;
	try {
		validatedEvent = LineMessageEvent.create({ message, userId, replyToken });
	} catch (error) {
		if (error instanceof LineMessageEventError) {
			console.error('Message event validation failed:', error.errors);
		}
		return { success: false, response: new Response('Invalid event data', { status: 400 }) };
	}

	// 許可されたユーザーチェック（設定されている場合）
	if (!config.isAllowedUser(validatedEvent.userId)) {
		await sendReply(validatedEvent.replyToken, '認証されていないユーザーです。', config.channelToken);
		return { success: false, response: new Response('Unauthorized user', { status: 403 }) };
	}

	return {
		success: true,
		event: validatedEvent,
	};
}
