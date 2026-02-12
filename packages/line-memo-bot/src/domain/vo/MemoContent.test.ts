import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { describe, expect, it } from 'vitest';
import { MemoContent } from './MemoContent';

describe('MemoContent', () => {
	describe('create', () => {
		it('正常なメモ内容でMemoContentが作成される', () => {
			const content = MemoContent.create('テストメモ');
			expect(content.value).toBe('テストメモ');
		});

		it('前後の空白文字がトリムされる', () => {
			const content = MemoContent.create('  テストメモ  ');
			expect(content.value).toBe('テストメモ');
		});

		it('空文字列の場合はServerErrorExceptionがスローされる', () => {
			expect(() => MemoContent.create('')).toThrow(ServerErrorException);
			expect(() => MemoContent.create('')).toThrow('Invalid memo content');
		});

		it('空白文字のみの場合はServerErrorExceptionがスローされる', () => {
			expect(() => MemoContent.create('   ')).toThrow(ServerErrorException);
			expect(() => MemoContent.create('   ')).toThrow('Invalid memo content');
		});

		it('10000文字を超える場合はServerErrorExceptionがスローされる', () => {
			const longContent = 'a'.repeat(10001);
			expect(() => MemoContent.create(longContent)).toThrow(ServerErrorException);
			expect(() => MemoContent.create(longContent)).toThrow('Invalid memo content');
		});

		it('10000文字ちょうどの場合は作成される', () => {
			const maxContent = 'a'.repeat(10000);
			const content = MemoContent.create(maxContent);
			expect(content.value).toBe(maxContent);
		});

		it('複数行のメモ内容が正しく処理される', () => {
			const multilineContent = '1行目\n2行目\n3行目';
			const content = MemoContent.create(multilineContent);
			expect(content.value).toBe(multilineContent);
		});
	});

	describe('toFormattedString', () => {
		it('メモ内容がそのまま返される', () => {
			const content = MemoContent.create('テストメモ');
			expect(content.toFormattedString()).toBe('テストメモ');
		});

		it('複数行のメモ内容が正しくフォーマットされる', () => {
			const multilineContent = '1行目\n2行目\n3行目';
			const content = MemoContent.create(multilineContent);
			expect(content.toFormattedString()).toBe(multilineContent);
		});
	});
});
