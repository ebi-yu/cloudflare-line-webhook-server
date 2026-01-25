import { ServerErrorException } from '../../../../utils/ServerErrorException';

export class LineTextMessageEventVo {
	private constructor(public readonly message: string, public readonly userId: string, public readonly replyToken: string) {}

	static create(params: { message?: string; userId?: string; replyToken?: string }): LineTextMessageEventVo {
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

		return new LineTextMessageEventVo(params.message!, params.userId!, params.replyToken!);
	}
}
