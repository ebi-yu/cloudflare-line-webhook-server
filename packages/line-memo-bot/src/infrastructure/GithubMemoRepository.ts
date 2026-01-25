import { Memo } from '../domain/entity/Memo';
import { MemoRepository } from '../domain/repository/MemoRepository';
import { sendFileCreateRequestToGithub } from './GithubApiClient';
import { GitHubConfigVo } from './vo/GitHubConfigVo';
import { GitHubFileCreateRequestVo } from './vo/GitHubFileCreateRequestVo';

/**
 * GitHubを使ったメモリポジトリの実装
 */
export class GithubMemoRepository implements MemoRepository {
	constructor(private readonly config: GitHubConfigVo) {}

	async save(memo: Memo): Promise<void> {
		const request = GitHubFileCreateRequestVo.create({
			path: this.config.path,
			owner: this.config.owner,
			githubToken: this.config.token,
			repoName: this.config.repoName,
			fileName: memo.getFileName(),
			content: memo.getContent(),
			committerName: this.config.committerName,
			committerEmail: this.config.committerEmail,
		});

		await sendFileCreateRequestToGithub(request);
	}
}
