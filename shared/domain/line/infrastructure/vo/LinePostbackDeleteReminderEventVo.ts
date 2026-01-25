import { ServerErrorException } from '../../../../utils/ServerErrorException';

export class LinePostbackDeleteReminderEventVo {
	private constructor(
		public readonly data: string,
		public readonly userId: string,
		public readonly replyToken: string,
		public readonly groupId: string
	) {}

	static create(params: { data?: string; userId?: string; replyToken?: string }): LinePostbackDeleteReminderEventVo {
		const errors: string[] = [];

		if (!params.data || params.data.trim() === '') {
			errors.push('data is required and cannot be empty');
		}

		// type=delete&groupId=xxxx のような形式を想定
		const { type, groupId } = params.data!.split('&').reduce((acc, pair) => {
			const [key, value] = pair.split('=');
			acc[key] = value;
			return acc;
		}, {} as Record<string, string>);
		if (type !== 'delete') {
			errors.push('data must contain type=delete');
		}
		if (!groupId || groupId.trim() === '') {
			errors.push('data must contain groupId');
		}

		if (!params.userId || params.userId.trim() === '') {
			errors.push('userId is required and cannot be empty');
		}
		if (!params.replyToken || params.replyToken.trim() === '') {
			errors.push('replyToken is required and cannot be empty');
		}

		if (errors.length > 0) {
			throw new ServerErrorException('Invalid postback event data', 400, errors);
		}

		return new LinePostbackDeleteReminderEventVo(params.data!, params.userId!, params.replyToken!, groupId);
	}
}
