import { ServerErrorException } from '../../../../../utils/ServerErrorException';

export class LineWebhookConfigVo {
	private constructor(
		public readonly channelSecret: string,
		public readonly channelToken: string,
		public readonly allowedUserId?: string,
	) {}

	static create(params: { channelSecret?: string; channelToken?: string; allowedUserId?: string }): LineWebhookConfigVo {
		const errors: string[] = [];

		if (!params.channelSecret) {
			errors.push('channelSecret is required');
		}
		if (!params.channelToken) {
			errors.push('channelToken is required');
		}

		if (errors.length > 0) {
			throw new ServerErrorException('Invalid webhook config', 400, errors);
		}

		return new LineWebhookConfigVo(params.channelSecret!, params.channelToken!, params.allowedUserId);
	}

	isAllowedUser(userId: string): boolean {
		if (!this.allowedUserId) {
			return true;
		}
		return userId === this.allowedUserId;
	}
}
