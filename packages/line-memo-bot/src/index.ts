import { handleLineWebhook } from './usecase/handleLineWebhook';

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		return handleLineWebhook(request, env);
	},
};
