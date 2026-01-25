import { MemoContent } from '../vo/MemoContent';

/**
 * メモエンティティ
 * メモの概念を表現するドメインモデル
 */
export class Memo {
	private constructor(
		public readonly id: string,
		public readonly content: MemoContent,
		public readonly userId: string,
		public readonly createdAt: Date
	) {}

	/**
	 * 新しいメモを作成する
	 */
	static create(params: { content: string; userId: string }): Memo {
		const memoContent = MemoContent.create(params.content);
		const id = Memo.generateId();
		const createdAt = new Date();

		return new Memo(id, memoContent, params.userId, createdAt);
	}

	/**
	 * メモIDを生成する（タイムスタンプベース）
	 */
	private static generateId(): string {
		return new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
	}

	/**
	 * GitHubに保存するためのファイル名を取得
	 */
	getFileName(): string {
		return `${this.id}.md`;
	}

	/**
	 * メモの内容を取得
	 */
	getContent(): string {
		return this.content.value;
	}

	/**
	 * 保存成功メッセージを生成
	 */
	generateSuccessMessage(): string {
		return `✅ メモをGitHubに保存しました。\n\n${this.content.toFormattedString()}`;
	}
}
