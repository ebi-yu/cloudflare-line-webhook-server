import { EnvVars } from '../types';

/**
 * 環境変数を取得して検証する
 * @returns 検証済みの環境変数オブジェクトと不足している変数名の配列
 */
export function getValidatedEnv(env: Record<string, string>): { ENV: EnvVars; missingVars: string[] } {
	const ENV = {
		GITHUB_TOKEN: env.GITHUB_TOKEN,
		OWNER: env.GITHUB_REPO_OWNER,
		REPO_NAME: env.GITHUB_REPO_NAME,
		PATH: env.GITHUB_PUSH_DIRECTORY_PATH,
		LINE_CHANNEL_TOKEN: env.LINE_CHANNEL_TOKEN,
		LINE_CHANNEL_SECRET: env.LINE_CHANNEL_SECRET,
		LINE_OWN_USER_ID: env.LINE_OWN_USER_ID,
	};

	const missingVars = Object.entries(ENV)
		.filter(([key, value]) => !value)
		.map(([key]) => key);

	return { ENV, missingVars };
}

/**
 * 環境変数が正しく設定されているか確認する
 * @returns 環境変数が正しく設定されていない場合はエラーレスポンスを返す、正しく設定されている場合はnullを返す
 */
export function validateEnv(env: Record<string, string>): Response | null {
	const { ENV, missingVars } = getValidatedEnv(env);

	if (missingVars.length > 0) {
		console.error(`❌ Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`);
		return new Response(`Cloudflare Env setting error: Missing variables - ${missingVars.join(', ')}`, { status: 500 });
	}

	return null;
}
