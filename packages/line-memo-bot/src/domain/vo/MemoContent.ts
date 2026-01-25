import { ServerErrorException } from '@shared/utils/ServerErrorException';

/**
 * メモの内容を表すValue Object
 */
export class MemoContent {
	private constructor(public readonly value: string) {}

	static create(value: string): MemoContent {
		const errors: string[] = [];

		if (!value || value.trim() === '') {
			errors.push('Memo content cannot be empty');
		}

		if (value.length > 10000) {
			errors.push('Memo content is too long (max 10000 characters)');
		}

		if (errors.length > 0) {
			throw new ServerErrorException('Invalid memo content', 400, errors);
		}

		return new MemoContent(value.trim());
	}

	/**
	 * メモ内容のフォーマット済み表現を取得
	 */
	toFormattedString(): string {
		return this.value;
	}
}
