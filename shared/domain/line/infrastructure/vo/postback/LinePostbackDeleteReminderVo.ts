import { LinePostbackVo } from './LinePostbackVo';

export class LinePostbackDeleteReminderVo extends LinePostbackVo {
	private constructor(
		data: string,
		userId: string,
		replyToken: string,
		public readonly groupId: string,
	) {
		super(data, userId, replyToken);
	}

	static create(params: { data?: string; userId?: string; replyToken?: string }): LinePostbackDeleteReminderVo {
		// 共通フィールドのバリデーション
		const errors = LinePostbackVo.validateCommonFields(params);

		// dataフィールドのパース
		const parsedData = LinePostbackVo.parseData(params.data || '');
		const { type, groupId } = parsedData;

		// type=delete&groupId=xxxx のような形式を想定
		if (type !== 'delete') {
			errors.push('data must contain type=delete');
		}
		if (!groupId || groupId.trim() === '') {
			errors.push('data must contain groupId');
		}

		// エラーチェック
		LinePostbackVo.throwIfErrors(errors, 'delete reminder');

		return new LinePostbackDeleteReminderVo(params.data!, params.userId!, params.replyToken!, groupId);
	}
}
