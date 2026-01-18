import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { sendFileCreateRequestToGithub } from '../infrastructure/githubApiClient';

/**
 * メッセージをGitHubに保存する
 */
export async function recordMemoToGithub(message: string, userId: string, env: Record<string, any>): Promise<string> {
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
		throw new ServerErrorException(`Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`, 500, missingVars);
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
