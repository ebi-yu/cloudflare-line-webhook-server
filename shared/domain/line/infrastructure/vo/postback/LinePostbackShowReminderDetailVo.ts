import { LinePostbackVo } from "./LinePostbackVo";

export class LinePostbackShowReminderDetailVo extends LinePostbackVo {
	private constructor(
		data: string,
		userId: string,
		replyToken: string,
		public readonly groupId: string,
	) {
		super(data, userId, replyToken);
	}

	static create(params: {
		data?: string;
		userId?: string;
		replyToken?: string;
	}): LinePostbackShowReminderDetailVo {
		// 共通フィールドのバリデーション
		const errors = LinePostbackVo.validateCommonFields(params);

		// dataフィールドのパース
		const parsedData = LinePostbackVo.parseData(params.data || "");
		const { type, groupId } = parsedData;

		// type=detail&groupId=xxxx のような形式を想定
		if (type !== "detail") {
			errors.push("data must contain type=detail");
		}
		if (!groupId || groupId.trim() === "") {
			errors.push("data must contain groupId");
		}

		// エラーチェック
		LinePostbackVo.throwIfErrors(errors, "show reminder detail");

		return new LinePostbackShowReminderDetailVo(
			params.data!,
			params.userId!,
			params.replyToken!,
			groupId,
		);
	}
}
