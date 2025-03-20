import { handleRequest } from './handlers/webhook';
import { info } from './utils/logger';

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		info('Webhook Received', { method: request.method, url: request.url });
		return handleRequest(request, env);
	},
};
