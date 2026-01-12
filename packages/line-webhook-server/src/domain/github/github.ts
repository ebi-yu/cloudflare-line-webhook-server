import { utf8ToBase64 } from '../../utils/base64';
import { InternalServerError } from '../../utils/error';
import { GitHubFileCreateParams } from './types';

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
			throw new InternalServerError('Failed to create file to github repository', { status: res.status });
		}
	} catch (err) {
		if (err instanceof InternalServerError) {
			throw err;
		}
		throw new InternalServerError('Error sending request to GitHub', err);
	}
}
