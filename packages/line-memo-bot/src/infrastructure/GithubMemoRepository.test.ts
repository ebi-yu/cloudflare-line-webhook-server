import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Memo } from '../domain/entity/Memo';
import * as GithubApiClient from './GithubApiClient';
import { GithubMemoRepository } from './GithubMemoRepository';
import { GitHubConfigVo } from './vo/GitHubConfigVo';

// GithubApiClientをモック化
vi.mock('./GithubApiClient', () => ({
	sendFileCreateRequestToGithub: vi.fn(),
}));

describe('GithubMemoRepository', () => {
	const mockConfig = GitHubConfigVo.create({
		token: 'test-token',
		owner: 'test-owner',
		repoName: 'test-repo',
		path: 'memos',
		committerName: 'Test User',
		committerEmail: 'test@example.com',
	});

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-25T10:30:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('save', () => {
		it('メモをGitHubに保存できる', async () => {
			const repository = new GithubMemoRepository(mockConfig);
			const memo = Memo.create({
				content: 'テストメモ',
				userId: 'user123',
			});

			await repository.save(memo);

			// sendFileCreateRequestToGithubが呼ばれたことを確認
			expect(GithubApiClient.sendFileCreateRequestToGithub).toHaveBeenCalledTimes(1);

			// 呼び出し時の引数を確認
			const callArgs = (GithubApiClient.sendFileCreateRequestToGithub as any).mock.calls[0][0];
			expect(callArgs.owner).toBe('test-owner');
			expect(callArgs.repoName).toBe('test-repo');
			expect(callArgs.path).toBe('memos');
			expect(callArgs.githubToken).toBe('test-token');
			expect(callArgs.fileName).toBe('2026-01-25_10-30-00.md');
			expect(callArgs.content).toBe('テストメモ');
			expect(callArgs.committerName).toBe('Test User');
			expect(callArgs.committerEmail).toBe('test@example.com');
		});

		it('複数行のメモを保存できる', async () => {
			const repository = new GithubMemoRepository(mockConfig);
			const memo = Memo.create({
				content: '1行目\n2行目\n3行目',
				userId: 'user123',
			});

			await repository.save(memo);

			expect(GithubApiClient.sendFileCreateRequestToGithub).toHaveBeenCalledTimes(1);

			const callArgs = (GithubApiClient.sendFileCreateRequestToGithub as any).mock.calls[0][0];
			expect(callArgs.content).toBe('1行目\n2行目\n3行目');
		});

		it('GitHub APIの呼び出しが失敗した場合はエラーが伝播される', async () => {
			// sendFileCreateRequestToGithubをエラーを返すようにモック
			vi.mocked(GithubApiClient.sendFileCreateRequestToGithub).mockRejectedValueOnce(new Error('GitHub API Error'));

			const repository = new GithubMemoRepository(mockConfig);
			const memo = Memo.create({
				content: 'テストメモ',
				userId: 'user123',
			});

			await expect(repository.save(memo)).rejects.toThrow('GitHub API Error');
		});

		it('異なるメモは異なるファイル名で保存される', async () => {
			const repository = new GithubMemoRepository(mockConfig);

			const memo1 = Memo.create({
				content: 'メモ1',
				userId: 'user123',
			});

			await repository.save(memo1);

			// 1秒後に別のメモを作成
			vi.setSystemTime(new Date('2026-01-25T10:30:01.000Z'));

			const memo2 = Memo.create({
				content: 'メモ2',
				userId: 'user123',
			});

			await repository.save(memo2);

			expect(GithubApiClient.sendFileCreateRequestToGithub).toHaveBeenCalledTimes(2);

			const callArgs1 = (GithubApiClient.sendFileCreateRequestToGithub as any).mock.calls[0][0];
			const callArgs2 = (GithubApiClient.sendFileCreateRequestToGithub as any).mock.calls[1][0];

			expect(callArgs1.fileName).toBe('2026-01-25_10-30-00.md');
			expect(callArgs2.fileName).toBe('2026-01-25_10-30-01.md');
		});

		it('設定された情報が正しく使用される', async () => {
			const customConfig = GitHubConfigVo.create({
				token: 'custom-token',
				owner: 'custom-owner',
				repoName: 'custom-repo',
				path: 'custom-path',
				committerName: 'Custom User',
				committerEmail: 'custom@example.com',
			});

			const repository = new GithubMemoRepository(customConfig);
			const memo = Memo.create({
				content: 'テストメモ',
				userId: 'user123',
			});

			await repository.save(memo);

			const callArgs = (GithubApiClient.sendFileCreateRequestToGithub as any).mock.calls[0][0];
			expect(callArgs.owner).toBe('custom-owner');
			expect(callArgs.repoName).toBe('custom-repo');
			expect(callArgs.path).toBe('custom-path');
			expect(callArgs.githubToken).toBe('custom-token');
			expect(callArgs.committerName).toBe('Custom User');
			expect(callArgs.committerEmail).toBe('custom@example.com');
		});
	});
});
