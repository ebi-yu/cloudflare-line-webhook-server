import { Env } from './types';
import { handleLineWebhook } from './usecases/handleLineWebhook';
import { handleScheduledReminders } from './usecases/handleScheduledReminders';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return handleLineWebhook(request, env);
	},

	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(handleScheduledReminders(env));
	},
};
