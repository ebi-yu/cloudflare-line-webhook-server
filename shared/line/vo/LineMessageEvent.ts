export class LineMessageEvent {
	private constructor(public readonly message: string, public readonly userId: string, public readonly replyToken: string) {}

	static create(params: { message?: string; userId?: string; replyToken?: string }): LineMessageEvent {
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
			throw new LineMessageEventError('Invalid message event data', errors);
		}

		return new LineMessageEvent(params.message!, params.userId!, params.replyToken!);
	}
}

export class LineMessageEventError extends Error {
	constructor(message: string, public readonly errors: string[]) {
		super(message);
		this.name = 'LineMessageEventError';
	}
}
