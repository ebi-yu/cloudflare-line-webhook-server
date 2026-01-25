import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { utf8ToBase64 } from '../utils/base64';
import { GitHubFileCreateRequestVo } from './vo/GitHubFileCreateRequestVo';

/**
 * Githubにファイル作成リクエストを送信
 */
export async function sendFileCreateRequestToGithub(request: GitHubFileCreateRequestVo): Promise<void> {
	// GitHub API でファイルを作成 & コミット
	const repoUrl = request.getRepoUrl();

	const myHeaders = new Headers();
	myHeaders.append('Accept', 'application/vnd.github+json');
	myHeaders.append('Content-Type', 'application/json');
	myHeaders.append('Authorization', `Bearer ${request.githubToken}`);
	myHeaders.append('User-Agent', 'Cloudflare-Workers/1.0');
	const raw = JSON.stringify({
		message: 'Add message from LINE',
		content: utf8ToBase64(request.content),
		committer: {
			name: request.committerName,
			email: request.committerEmail,
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
