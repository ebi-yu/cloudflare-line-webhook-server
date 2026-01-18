import { ServerErrorException } from '@shared/utils/ServerErrorException';
export class LineConfigVo {
	private constructor(public readonly channelSecret: string, public readonly channelToken: string, public readonly ownUserId: string) {}

	static create(env: { LINE_CHANNEL_SECRET?: string; LINE_CHANNEL_TOKEN?: string; LINE_OWN_USER_ID?: string }): LineConfigVo {
		const errors: string[] = [];

		if (!env.LINE_CHANNEL_SECRET) {
			errors.push('LINE_CHANNEL_SECRET is required');
		}
		if (!env.LINE_CHANNEL_TOKEN) {
			errors.push('LINE_CHANNEL_TOKEN is required');
		}
		if (!env.LINE_OWN_USER_ID) {
			errors.push('LINE_OWN_USER_ID is required');
		}

		if (errors.length > 0) {
			throw new ServerErrorException('Missing required environment variables', 500, errors);
		}

		return new LineConfigVo(env.LINE_CHANNEL_SECRET!, env.LINE_CHANNEL_TOKEN!, env.LINE_OWN_USER_ID!);
	}
}
