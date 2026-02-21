import { LineEvent } from '@shared/domain/line/types';
import { ServerErrorException } from '../../../../../utils/ServerErrorException';

// テキストメッセージイベント型
export interface LineTextMessageEvent extends LineEvent {
	type: 'message';
	message: {
		id: string;
		type: 'text';
		text: string;
	};
}

/**
 * LINEのテキストメッセージイベントのVO
 */
export class LineWebhookMessageVo {
	private constructor(
		public readonly message: string,
		public readonly userId: string,
		public readonly replyToken: string,
	) {}

	static isTextMessageEvent = (event: LineEvent): event is LineTextMessageEvent => {
		return event.type === 'message' && event.message !== undefined && event.message.type === 'text';
	};

	static create(params: { message?: string; userId?: string; replyToken?: string }): LineWebhookMessageVo {
		const errors: string[] = [];

		if (!params.message || params.message.trim() === '') {
			errors.push('message is required and cannot be empty');
		}
		if (!params.userId || params.userId.trim() === '') {
			errors.push('userId is required and cannot be empty');
		}
		if (!params.replyToken || params.replyToken.trim() === '') {
			errors.push('replyToken is required and cannot be empty');
		}

		if (errors.length > 0) {
			throw new ServerErrorException('Invalid message event data', 400, errors);
		}

		return new LineWebhookMessageVo(params.message!, params.userId!, params.replyToken!);
	}
}
