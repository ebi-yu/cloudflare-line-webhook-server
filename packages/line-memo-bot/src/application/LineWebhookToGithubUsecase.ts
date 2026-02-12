import { Memo } from '../domain/entity/Memo';
import { IMemoRepository } from '../domain/interface/IMemoRepository';

/**
 * LINEからのメッセージをメモとして記録するユースケース
 */
export async function recordMemoFromLine(vo: { message: string; userId: string; memoRepository: IMemoRepository }): Promise<string> {
	const { message, userId, memoRepository } = vo;

	// ドメインモデルの生成（バリデーション含む）
	const memo = Memo.create({
		content: message,
		userId,
	});

	// 永続化
	await memoRepository.save(memo);

	// ドメインモデルからメッセージを生成して返す
	return memo.generateSuccessMessage();
}
