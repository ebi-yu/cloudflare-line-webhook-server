import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { utf8ToBase64 } from '../utils/base64';

/**
 * Githubにファイル作成リクエストを送信
 */
export async function sendFileCreateRequestToGithub(params: GitHubFileCreateParams): Promise<void> {
	const { path, owner, repoName, message, githubToken } = params;

	// 日付をファイル名にする
	const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]; // `YYYY-MM-DD_HH-mm-ss`
	const filePath = encodeURIComponent(`${path.startsWith('/') ? path.slice(1, path.length) : path}/${timestamp}.md`);

	// GitHub API でファイルを作成 & コミット
	const repoUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`;

	const myHeaders = new Headers();
	myHeaders.append('Accept', 'application/vnd.github+json');
	myHeaders.append('Content-Type', 'application/json');
	myHeaders.append('Authorization', `Bearer ${githubToken}`);
	myHeaders.append('User-Agent', 'Cloudflare-Workers/1.0');
	const raw = JSON.stringify({
		message: 'Add message from LINE',
		content: utf8ToBase64(message),
		committer: {
			name: params.committerName || 'Line Webhook',
			email: params.committerEmail || 'line_webhook@example.com',
		},
	});
	const requestOptions = {
		method: 'PUT',
		headers: myHeaders,
		body: raw,
		redirect: 'follow',
	};

	try {
		const res = await fetch(repoUrl, requestOptions);
		if (res.status !== 201) {
			throw new ServerErrorException('Failed to create file to github repository', 500);
		}
	} catch (err) {
		throw new ServerErrorException('Error sending request to GitHub', 500);
	}
}

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
