import { Memo } from '../entity/Memo';

/**
 * メモリポジトリのインターフェース
 * データの永続化方法を抽象化
 */
export interface MemoRepository {
	/**
	 * メモを保存する
	 */
	save(memo: Memo): Promise<void>;
}
