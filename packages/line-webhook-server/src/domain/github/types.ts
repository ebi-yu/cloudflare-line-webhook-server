// GitHub API リクエスト用の型定義
export interface GitHubFileCreateParams {
	path: string;
	owner: string;
	repoName: string;
	githubToken: string;
	message: string;
	committerName?: string;
	committerEmail?: string;
}

// GitHub API レスポンス用の型定義
export interface GitHubApiResponse {
	status: number;
	data?: any;
	error?: string;
}
