import { ServerErrorException } from '@shared/utils/ServerErrorException';

/**
 * GitHub設定を表すValue Object
 */
export class GitHubConfigVo {
	private constructor(
		public readonly token: string,
		public readonly owner: string,
		public readonly repoName: string,
		public readonly path: string,
		public readonly committerName: string,
		public readonly committerEmail: string
	) {}

	static create(params: {
		token?: string;
		owner?: string;
		repoName?: string;
		path?: string;
		committerName?: string;
		committerEmail?: string;
	}): GitHubConfigVo {
		const errors: string[] = [];

		if (!params.token) {
			errors.push('GITHUB_TOKEN is required');
		}
		if (!params.owner) {
			errors.push('GITHUB_REPO_OWNER is required');
		}
		if (!params.repoName) {
			errors.push('GITHUB_REPO_NAME is required');
		}
		if (!params.path) {
			errors.push('GITHUB_PUSH_DIRECTORY_PATH is required');
		}
		if (!params.committerName) {
			errors.push('GITHUB_COMMITTER_NAME is required');
		}
		if (!params.committerEmail) {
			errors.push('GITHUB_COMMITTER_EMAIL is required');
		}

		if (errors.length > 0) {
			throw new ServerErrorException('Invalid GitHub configuration', 500, errors);
		}

		return new GitHubConfigVo(params.token!, params.owner!, params.repoName!, params.path!, params.committerName!, params.committerEmail!);
	}
}
