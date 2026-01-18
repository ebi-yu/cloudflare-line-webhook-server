import { sendReplyToLine } from '@shared/line/infrastructure/lineApiClient';
import { sendFileCreateRequestToGithub } from '../infrastructure/githubApiClient';

export async function recordMemoFromLine(vo: { message: string; replyToken: string; env: Record<string, any> }): Promise<void> {
	const { message, replyToken, env } = vo;
	const responseMessage = await saveMessageToGithub({ message, env });
	await sendReplyToLine(replyToken, responseMessage, env.LINE_CHANNEL_TOKEN);
}

/**
 * メッセージをGitHubに保存する処理
 */
async function saveMessageToGithub(vo: { message: string; env: Record<string, any> }): Promise<string> {
	const { message, env } = vo;
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
		throw new Error(`Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`);
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
