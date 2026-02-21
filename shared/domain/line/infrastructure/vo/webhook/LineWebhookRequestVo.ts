import { ServerErrorException } from '../../../../../utils/ServerErrorException';
import { LineEvent, LineWebhookEvent } from '../../../types';
import { LineWebhookConfigVo } from './LineWebhookConfigVo';
import { LineWebhookSignatureVo } from './LineWebhookSignatureVo';

/**
 * LINE WebhookリクエストのVO
 * Webhookリクエストの検証、パース、イベント抽出を担当
 */
export class LineWebhookRequestVo {
	private constructor(
		public readonly bodyText: string,
		public readonly event: LineEvent,
	) {}

	/**
	 * Requestから検証済みWebhookリクエストを作成
	 * @throws {ServerErrorException} 検証に失敗した場合
	 */
	static async createFromRequest(request: Request, config: LineWebhookConfigVo): Promise<LineWebhookRequestVo> {
		// HTTPメソッドチェック
		if (request.method !== 'POST') {
			throw new ServerErrorException('Method Not Allowed', 405);
		}

		// 署名検証
		const signatureVo = await LineWebhookSignatureVo.createFromRequest(request, config.channelSecret);
		const isValid = await signatureVo.validate();

		if (!isValid) {
			throw new ServerErrorException('Invalid signature', 401);
		}

		// WebhookリクエストVOの作成
		return this.create(signatureVo.getBodyText());
	}

	/**
	 * ボディテキストからWebhookリクエストを作成
	 */
	static create(bodyText: string): LineWebhookRequestVo {
		try {
			const body: LineWebhookEvent = JSON.parse(bodyText);
			const event = body.events?.[0];

			if (!event) {
				throw new ServerErrorException('No events in webhook request', 400);
			}

			return new LineWebhookRequestVo(bodyText, event);
		} catch (error) {
			if (error instanceof ServerErrorException) {
				throw error;
			}
			throw new ServerErrorException('Invalid webhook request body', 400);
		}
	}

	/**
	 * メッセージイベントかどうかを判定
	 */
	isMessageEvent(): boolean {
		return this.event.type === 'message';
	}

	/**
	 * ユーザーIDを取得
	 */
	getUserId(): string | undefined {
		return this.event.source?.type === 'user' || this.event.source?.type === 'group' ? this.event.source.userId : undefined;
	}

	/**
	 * グループIDを取得
	 */
	getGroupId(): string | undefined {
		return this.event.source?.type === 'group' ? this.event.source.groupId : undefined;
	}
}

/**
 * テキストメッセージイベントかどうかを判定（ヘルパー関数）
 */
export function isTextMessageEvent(event: LineEvent): boolean {
	return event.type === 'message' && event.message !== undefined && event.message.type === 'text';
}

/**
 * Postbackイベントかどうかを判定（ヘルパー関数）
 */
export function isPostbackEvent(event: LineEvent): boolean {
	return event.type === 'postback' && event.postback !== undefined;
}
