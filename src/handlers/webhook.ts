import { LineWebhookEvent } from '../types/line';
import { EnvVars } from '../types';
import { isValidSignature, sendReply } from './line';
import { sendFileCreateRequestToGithub } from './github';
import { error } from '../utils/logger';

/**
 * Webhookを処理する関数
 */
export async function handleRequest(request: Request, env: Record<string, string>): Promise<Response> {
	// POSTメソッド以外はエラー
	if (request.method !== 'POST') {
		error('Method not allowed', { method: request.method });
		return new Response('Method Not Allowed', { status: 405 });
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
		error(`Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`);
		return new Response(`Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`, { status: 500 });
	}

	const bodyText = await request.text();

	// LINE Webhookの署名を検証
	const signature = request.headers.get('x-line-signature');
	if (!(await isValidSignature(bodyText, signature, ENV.LINE_CHANNEL_SECRET))) {
		error('Invalid signature');
		return new Response('Invalid signature', { status: 401 });
	}

	// ボディの解析
	let body: LineWebhookEvent;
	try {
		body = JSON.parse(bodyText);
	} catch (e) {
		error('Invalid JSON', e);
		return new Response('Invalid JSON', { status: 400 });
	}
	const lineEvent = body.events?.[0];
	const message = lineEvent?.message?.text;

	// メッセージイベント以外エラー
	if (lineEvent?.type !== 'message') {
		error('LineEvent Type is not message');
		return new Response('LineEvent Type is not message', { status: 400 });
	}
	// テキストメッセージ以外エラー
	if (lineEvent?.message?.type !== 'text') {
		error('LineEvent MessageType is not text');
		return new Response('LineEvent Type is not text', { status: 400 });
	}
	// テキストメッセージが空の場合エラー
	if (message == '' || message == null) {
		error('No Message');
		return new Response('No Message Text', { status: 400 });
	}
	// 特定ユーザからのメッセージ以外の場合エラー
	if (lineEvent?.source?.type !== 'user' || lineEvent?.source?.userId !== ENV.LINE_OWN_USER_ID) {
		error('Unauthorized userId', { userId: lineEvent?.source?.userId });
		return new Response('Unauthorized userId', { status: 400 });
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

	return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
}
