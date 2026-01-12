import { sendFileCreateRequestToGithub } from './domain/github/github';
import { isValidSignature, sendReply } from './domain/line/line';
import { LineWebhookEvent } from './domain/line/types';
import { AuthenticationError, createSuccessResponse, handleError, InternalServerError, ValidationError } from './utils/error';
import { info } from './utils/logger';

/**
 * Webhookを処理する関数
 */
async function handleRequest(request: Request, env: Record<string, string>): Promise<Response> {
	try {
		// POSTメソッド以外はエラー
		if (request.method !== 'POST') {
			throw new ValidationError('Method Not Allowed', { method: request.method });
		}

		// 環境変数の取得
		const ENV = {
			GITHUB_TOKEN: env.GITHUB_TOKEN,
			OWNER: env.GITHUB_REPO_OWNER,
			REPO_NAME: env.GITHUB_REPO_NAME,
			PATH: env.GITHUB_PUSH_DIRECTORY_PATH,
			LINE_CHANNEL_TOKEN: env.LINE_CHANNEL_TOKEN,
			LINE_CHANNEL_SECRET: env.LINE_CHANNEL_SECRET,
			LINE_OWN_USER_ID: env.LINE_OWN_USER_ID,
			// コミッター情報（デフォルト値あり）
			GITHUB_COMMITTER_NAME: env.GITHUB_COMMITTER_NAME,
			GITHUB_COMMITTER_EMAIL: env.GITHUB_COMMITTER_EMAIL,
		};
		const missingVars = Object.entries(ENV)
			.filter(([key, value]) => !value)
			.map(([key]) => key);
		if (missingVars.length > 0) {
			throw new InternalServerError(`Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`);
		}

		const bodyText = await request.text();

		// LINE Webhookの署名を検証
		const signature = request.headers.get('x-line-signature');
		if (!(await isValidSignature(bodyText, signature, ENV.LINE_CHANNEL_SECRET))) {
			throw new AuthenticationError('Invalid signature');
		}

		// ボディの解析
		let body: LineWebhookEvent;
		try {
			body = JSON.parse(bodyText);
		} catch (e) {
			throw new ValidationError('Invalid JSON', e);
		}
		const lineEvent = body.events?.[0];
		const message = lineEvent?.message?.text;

		// メッセージイベント以外エラー
		if (lineEvent?.type !== 'message') {
			throw new ValidationError('LineEvent Type is not message');
		}
		// テキストメッセージ以外エラー
		if (lineEvent?.message?.type !== 'text') {
			throw new ValidationError('LineEvent MessageType is not text');
		}
		// テキストメッセージが空の場合エラー
		if (message == '' || message == null) {
			throw new ValidationError('No Message Text');
		}
		// 特定ユーザからのメッセージ以外の場合エラー
		if (lineEvent?.source?.type !== 'user' || lineEvent?.source?.userId !== ENV.LINE_OWN_USER_ID) {
			throw new AuthenticationError('Unauthorized userId', { userId: lineEvent?.source?.userId });
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

		// LINEからの応答（エコーバック）
		await sendReply(lineEvent?.replyToken, `受け取ったメッセージ: ${message}`, ENV.LINE_CHANNEL_TOKEN);

		return createSuccessResponse({ status: 'ok' });
	} catch (err) {
		return handleError(err);
	}
}

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		info('Webhook Received', { method: request.method, url: request.url });
		return handleRequest(request, env);
	},
};
