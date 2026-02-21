import { LinePostbackVo } from './LinePostbackVo';

export class LinePostbackShowReminderListVo extends LinePostbackVo {
	private constructor(data: string, userId: string, replyToken: string) {
		super(data, userId, replyToken);
	}

	static create(params: { data?: string; userId?: string; replyToken?: string }): LinePostbackShowReminderListVo {
		// 共通フィールドのバリデーション
		const errors = LinePostbackVo.validateCommonFields(params);

		// dataフィールドのパース
		const parsedData = LinePostbackVo.parseData(params.data || '');
		const { type } = parsedData;

		// type=list のような形式を想定
		if (type !== 'list') {
			errors.push('data must contain type=list');
		}

		// エラーチェック
		LinePostbackVo.throwIfErrors(errors, 'show reminder list');

		return new LinePostbackShowReminderListVo(params.data!, params.userId!, params.replyToken!);
	}
}
