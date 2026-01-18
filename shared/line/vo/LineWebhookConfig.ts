export class LineWebhookConfig {
	private constructor(
		public readonly channelSecret: string,
		public readonly channelToken: string,
		public readonly allowedUserId?: string
	) {}

	static create(params: { channelSecret?: string; channelToken?: string; allowedUserId?: string }): LineWebhookConfig {
		const errors: string[] = [];

		if (!params.channelSecret) {
			errors.push('channelSecret is required');
		}
		if (!params.channelToken) {
			errors.push('channelToken is required');
		}

		if (errors.length > 0) {
			throw new LineWebhookConfigError('Invalid webhook config', errors);
		}

		return new LineWebhookConfig(params.channelSecret!, params.channelToken!, params.allowedUserId);
	}

	isAllowedUser(userId: string): boolean {
		if (!this.allowedUserId) {
			return true;
		}
		return userId === this.allowedUserId;
	}
}

export class LineWebhookConfigError extends Error {
	constructor(message: string, public readonly errors: string[]) {
		super(message);
		this.name = 'LineWebhookConfigError';
	}
}
