import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Memo } from './Memo';

describe('Memo', () => {
	beforeEach(() => {
		// 時刻を固定してテストの安定性を確保
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-25T10:30:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('create', () => {
		it('正常なパラメータでMemoが作成される', () => {
			const memo = Memo.create({
				content: 'テストメモ',
				userId: 'user123',
			});

			expect(memo.getContent()).toBe('テストメモ');
			expect(memo.userId).toBe('user123');
			expect(memo.id).toBe('2026-01-25_10-30-00');
			expect(memo.createdAt).toEqual(new Date('2026-01-25T10:30:00.000Z'));
		});

		it('前後の空白がトリムされたメモが作成される', () => {
			const memo = Memo.create({
				content: '  テストメモ  ',
				userId: 'user123',
			});

			expect(memo.getContent()).toBe('テストメモ');
		});

		it('空文字列の場合はServerErrorExceptionがスローされる', () => {
			expect(() =>
				Memo.create({
					content: '',
					userId: 'user123',
				})
			).toThrow(ServerErrorException);
		});

		it('長いメモも作成できる', () => {
			const longContent = 'a'.repeat(5000);
			const memo = Memo.create({
				content: longContent,
				userId: 'user123',
			});

			expect(memo.getContent()).toBe(longContent);
		});
	});

	describe('getFileName', () => {
		it('IDをベースにしたファイル名が返される', () => {
			const memo = Memo.create({
				content: 'テストメモ',
				userId: 'user123',
			});

			expect(memo.getFileName()).toBe('2026-01-25_10-30-00.md');
		});
	});

	describe('getContent', () => {
		it('メモの内容が返される', () => {
			const memo = Memo.create({
				content: 'テストメモ',
				userId: 'user123',
			});

			expect(memo.getContent()).toBe('テストメモ');
		});
	});

	describe('generateSuccessMessage', () => {
		it('保存成功メッセージが生成される', () => {
			const memo = Memo.create({
				content: 'テストメモ',
				userId: 'user123',
			});

			const message = memo.generateSuccessMessage();
			expect(message).toContain('✅ メモをGitHubに保存しました。');
			expect(message).toContain('テストメモ');
		});

		it('複数行のメモでもメッセージが生成される', () => {
			const memo = Memo.create({
				content: '1行目\n2行目\n3行目',
				userId: 'user123',
			});

			const message = memo.generateSuccessMessage();
			expect(message).toContain('✅ メモをGitHubに保存しました。');
			expect(message).toContain('1行目\n2行目\n3行目');
		});
	});

	describe('ID生成', () => {
		it('異なる時刻で作成されたメモは異なるIDを持つ', () => {
			const memo1 = Memo.create({
				content: 'メモ1',
				userId: 'user123',
			});

			vi.setSystemTime(new Date('2026-01-25T10:30:01.000Z'));

			const memo2 = Memo.create({
				content: 'メモ2',
				userId: 'user123',
			});

			expect(memo1.id).not.toBe(memo2.id);
			expect(memo1.id).toBe('2026-01-25_10-30-00');
			expect(memo2.id).toBe('2026-01-25_10-30-01');
		});
	});
});
