import { LineWebhookConfig, sendReply, validateLineWebhook } from '@shared/line';
import { info, InternalServerError } from '@shared/utils';
import { sendFileCreateRequestToGithub } from '../interface/githubApiClient';

export async function handleLineWebhook(request: Request, env: any): Promise<Response> {
	try {
		info('Webhook Received', { method: request.method, url: request.url });

		const webhookConfig = LineWebhookConfig.create({
			channelSecret: env.LINE_CHANNEL_SECRET,
			channelToken: env.LINE_CHANNEL_TOKEN,
			allowedUserId: env.LINE_OWN_USER_ID,
		});

		const result = await validateLineWebhook(request, webhookConfig);

		if (!result.success) {
			return result.response;
		}

		const { message, userId, replyToken } = result.event;
		const responseMessage = await handleMessage(message, userId, env);
		await sendReply(replyToken, responseMessage, env.LINE_CHANNEL_TOKEN);

		return new Response('OK', { status: 200 });
	} catch (error) {
		console.error('Error handling webhook:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}

/**
 * メッセージをGitHubに保存する処理
 */
async function handleMessage(message: string, userId: string, env: Record<string, string>): Promise<string> {
	// 環境変数の取得
	const ENV = {
		GITHUB_TOKEN: env.GITHUB_TOKEN,
		OWNER: env.GITHUB_REPO_OWNER,
		REPO_NAME: env.GITHUB_REPO_NAME,
		PATH: env.GITHUB_PUSH_DIRECTORY_PATH,
		GITHUB_COMMITTER_NAME: env.GITHUB_COMMITTER_NAME,
		GITHUB_COMMITTER_EMAIL: env.GITHUB_COMMITTER_EMAIL,
	};
	const missingVars = Object.entries(ENV)
		.filter(([_key, value]) => !value)
		.map(([key]) => key);
	if (missingVars.length > 0) {
		throw new InternalServerError(`Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`);
	}

	// githubレポジトリにファイル作成リクエストを送る
	await sendFileCreateRequestToGithub({
		path: ENV.PATH,
		owner: ENV.OWNER,
		githubToken: ENV.GITHUB_TOKEN,
		repoName: ENV.REPO_NAME,
		message,
		committerName: ENV.GITHUB_COMMITTER_NAME,
		committerEmail: ENV.GITHUB_COMMITTER_EMAIL,
	});

	return `受け取ったメッセージ: ${message}`;
}
