import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { describe, expect, it, vi } from 'vitest';
import { Memo } from '../domain/entity/Memo';
import { IMemoRepository } from '../domain/interface/IMemoRepository';
import { recordMemoFromLine } from './LineWebhookToGithubUsecase';

describe('LineWebhookToGithubUsecase', () => {
	describe('recordMemoFromLine', () => {
		it('正常なメッセージをメモとして記録できる', async () => {
			// モックリポジトリの作成
			const mockRepository: IMemoRepository = {
				save: vi.fn().mockResolvedValue(undefined),
			};

			const result = await recordMemoFromLine({
				message: 'テストメモ',
				userId: 'user123',
				memoRepository: mockRepository,
			});

			// リポジトリのsaveが呼ばれたことを確認
			expect(mockRepository.save).toHaveBeenCalledTimes(1);

			// saveに渡されたメモの内容を確認
			const savedMemo = (mockRepository.save as any).mock.calls[0][0] as Memo;
			expect(savedMemo.getContent()).toBe('テストメモ');
			expect(savedMemo.userId).toBe('user123');

			// 成功メッセージが返されることを確認
			expect(result).toContain('✅ メモをGitHubに保存しました。');
			expect(result).toContain('テストメモ');
		});

		it('複数行のメッセージをメモとして記録できる', async () => {
			const mockRepository: IMemoRepository = {
				save: vi.fn().mockResolvedValue(undefined),
			};

			const multilineMessage = '1行目\n2行目\n3行目';
			const result = await recordMemoFromLine({
				message: multilineMessage,
				userId: 'user123',
				memoRepository: mockRepository,
			});

			expect(mockRepository.save).toHaveBeenCalledTimes(1);

			const savedMemo = (mockRepository.save as any).mock.calls[0][0] as Memo;
			expect(savedMemo.getContent()).toBe(multilineMessage);

			expect(result).toContain(multilineMessage);
		});

		it('空文字列の場合はServerErrorExceptionがスローされる', async () => {
			const mockRepository: IMemoRepository = {
				save: vi.fn().mockResolvedValue(undefined),
			};

			await expect(
				recordMemoFromLine({
					message: '',
					userId: 'user123',
					memoRepository: mockRepository,
				})
			).rejects.toThrow(ServerErrorException);

			// saveが呼ばれないことを確認
			expect(mockRepository.save).not.toHaveBeenCalled();
		});

		it('空白文字のみの場合はServerErrorExceptionがスローされる', async () => {
			const mockRepository: IMemoRepository = {
				save: vi.fn().mockResolvedValue(undefined),
			};

			await expect(
				recordMemoFromLine({
					message: '   ',
					userId: 'user123',
					memoRepository: mockRepository,
				})
			).rejects.toThrow(ServerErrorException);

			expect(mockRepository.save).not.toHaveBeenCalled();
		});

		it('リポジトリの保存処理が失敗した場合はエラーが伝播される', async () => {
			const mockRepository: IMemoRepository = {
				save: vi.fn().mockRejectedValue(new Error('GitHub API Error')),
			};

			await expect(
				recordMemoFromLine({
					message: 'テストメモ',
					userId: 'user123',
					memoRepository: mockRepository,
				})
			).rejects.toThrow('GitHub API Error');

			expect(mockRepository.save).toHaveBeenCalledTimes(1);
		});

		it('前後の空白がトリムされたメモが保存される', async () => {
			const mockRepository: IMemoRepository = {
				save: vi.fn().mockResolvedValue(undefined),
			};

			const result = await recordMemoFromLine({
				message: '  テストメモ  ',
				userId: 'user123',
				memoRepository: mockRepository,
			});

			const savedMemo = (mockRepository.save as any).mock.calls[0][0] as Memo;
			expect(savedMemo.getContent()).toBe('テストメモ');
		});

		it('異なるユーザーIDでメモを記録できる', async () => {
			const mockRepository: IMemoRepository = {
				save: vi.fn().mockResolvedValue(undefined),
			};

			await recordMemoFromLine({
				message: 'ユーザー1のメモ',
				userId: 'user1',
				memoRepository: mockRepository,
			});

			await recordMemoFromLine({
				message: 'ユーザー2のメモ',
				userId: 'user2',
				memoRepository: mockRepository,
			});

			expect(mockRepository.save).toHaveBeenCalledTimes(2);

			const savedMemo1 = (mockRepository.save as any).mock.calls[0][0] as Memo;
			const savedMemo2 = (mockRepository.save as any).mock.calls[1][0] as Memo;

			expect(savedMemo1.userId).toBe('user1');
			expect(savedMemo2.userId).toBe('user2');
		});
	});
});
