// 環境変数の型定義
export interface EnvVars {
	GITHUB_TOKEN: string;
	OWNER: string;
	REPO_NAME: string;
	PATH: string;
	LINE_CHANNEL_TOKEN: string;
	LINE_CHANNEL_SECRET: string;
	LINE_OWN_USER_ID: string;
	GITHUB_COMMITTER_NAME?: string;
	GITHUB_COMMITTER_EMAIL?: string;
}

// その他の共通型定義があれば追加
