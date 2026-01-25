import { ServerErrorException } from '@shared/utils/ServerErrorException';

/**
 * GitHubファイル作成リクエストを表すValue Object
 */
export class GitHubFileCreateRequestVo {
	private constructor(
		public readonly path: string,
		public readonly owner: string,
		public readonly repoName: string,
		public readonly githubToken: string,
		public readonly fileName: string,
		public readonly content: string,
		public readonly committerName: string,
		public readonly committerEmail: string
	) {}

	static create(params: {
		path: string;
		owner: string;
		repoName: string;
		githubToken: string;
		fileName: string;
		content: string;
		committerName?: string;
		committerEmail?: string;
	}): GitHubFileCreateRequestVo {
		const errors: string[] = [];

		if (!params.path || params.path.trim() === '') {
			errors.push('path is required');
		}
		if (!params.owner || params.owner.trim() === '') {
			errors.push('owner is required');
		}
		if (!params.repoName || params.repoName.trim() === '') {
			errors.push('repoName is required');
		}
		if (!params.githubToken || params.githubToken.trim() === '') {
			errors.push('githubToken is required');
		}
		if (!params.fileName || params.fileName.trim() === '') {
			errors.push('fileName is required');
		}
		if (!params.content || params.content.trim() === '') {
			errors.push('content is required');
		}

		if (errors.length > 0) {
			throw new ServerErrorException('Invalid GitHub file create request', 400, errors);
		}

		return new GitHubFileCreateRequestVo(
			params.path.trim(),
			params.owner.trim(),
			params.repoName.trim(),
			params.githubToken.trim(),
			params.fileName.trim(),
			params.content.trim(),
			params.committerName?.trim() || 'Line Webhook',
			params.committerEmail?.trim() || 'line_webhook@example.com'
		);
	}

	/**
	 * GitHub APIで使用するファイルパスを取得
	 */
	getEncodedFilePath(): string {
		const normalizedPath = this.path.startsWith('/') ? this.path.slice(1) : this.path;
		return encodeURIComponent(`${normalizedPath}/${this.fileName}`);
	}

	/**
	 * リポジトリURLを取得
	 */
	getRepoUrl(): string {
		return `https://api.github.com/repos/${this.owner}/${this.repoName}/contents/${this.getEncodedFilePath()}`;
	}
}
