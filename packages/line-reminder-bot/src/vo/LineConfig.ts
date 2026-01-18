export class LineConfig {
	private constructor(public readonly channelSecret: string, public readonly channelToken: string, public readonly ownUserId: string) {}

	static create(env: { LINE_CHANNEL_SECRET?: string; LINE_CHANNEL_TOKEN?: string; LINE_OWN_USER_ID?: string }): LineConfig {
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
			throw new ConfigurationError('Missing required environment variables', errors);
		}

		return new LineConfig(env.LINE_CHANNEL_SECRET!, env.LINE_CHANNEL_TOKEN!, env.LINE_OWN_USER_ID!);
	}
}

export class ConfigurationError extends Error {
	constructor(message: string, public readonly errors: string[]) {
		super(message);
		this.name = 'ConfigurationError';
	}
}
