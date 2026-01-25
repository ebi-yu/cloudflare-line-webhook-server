import { ServerErrorException } from '../../utils/ServerErrorException';
import { LineEvent, LinePostbackEvent, LineTextMessageEventVo, LineWebhookEvent } from '../types';
import { LineWebhookConfigVo } from '../vo/LineWebhookConfigVo';

/**
 * LINE Webhookの署名検証サービス（Infrastructure層）
 * 外部システム（LINE）との接続とプロトコルレベルの検証を担当
 */
export class LineWebhookValidator {
	/**
	 * LINE Webhookの署名を検証する
	 */
	static async validateSignature(bodyText: string, signature: string | null, secret: string): Promise<boolean> {
		if (!signature) return false;

		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);
		const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

		// HMAC-SHA256 の署名を計算
		const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
		const hashArray = Array.from(new Uint8Array(signatureBytes));
		const computedSignature = btoa(String.fromCharCode(...hashArray)); // Base64 エンコード
		console.log('Computed signature', computedSignature);
		return computedSignature === signature;
	}

	/**
	 * Webhook リクエストの基本検証とイベント抽出
	 * @throws {Error} 検証に失敗した場合（errorにstatusCodeプロパティを追加）
	 */
	static async validateWebhookRequest(request: Request, config: LineWebhookConfigVo): Promise<{ bodyText: string; event: LineEvent }> {
		// HTTPメソッドチェック
		if (request.method !== 'POST') {
			throw new ServerErrorException('Method Not Allowed', 405);
		}

		const bodyText = await request.text();
		const signature = request.headers.get('x-line-signature');

		// 署名検証
		if (!(await this.validateSignature(bodyText, signature, config.channelSecret))) {
			throw new ServerErrorException('Invalid signature', 401);
		}

		// イベントのパースと存在確認
		const body: LineWebhookEvent = JSON.parse(bodyText);
		const event = body.events?.[0];

		if (!event) {
			throw new ServerErrorException('No events', 400);
		}

		return { bodyText, event };
	}
}

/**
 * イベントタイプのタイプガード（型推論付き）
 */
export const isPostbackEvent = (event: LineEvent): event is LinePostbackEvent => {
	return event.type === 'postback' && event.postback !== undefined;
};

export const isTextMessageEvent = (event: LineEvent): event is LineTextMessageEventVo => {
	return event.type === 'message' && event.message !== undefined && event.message.type === 'text';
};
