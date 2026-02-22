import { LineEvent } from "@shared/domain/line/types";
import { ServerErrorException } from "../../../../../utils/ServerErrorException";

// ポストバックイベント型
export interface LinePostbackEvent extends LineEvent {
	type: "postback";
	postback: LinePostback;
}

// Postbackの型
export interface LinePostback {
	data: string;
	params?: Record<string, string>;
}

/**
 * LINEのPostbackイベントの基底VO
 */
export abstract class LinePostbackVo {
	protected constructor(
		public readonly data: string,
		public readonly userId: string,
		public readonly replyToken: string,
	) {}

	protected static isPostbackEvent = (event: LineEvent): event is LinePostbackEvent => {
		return event.type === "postback" && event.postback !== undefined;
	};

	/**
	 * dataフィールドをパースしてkey-valueのレコードに変換
	 * data形式: "key1=value1&key2=value2&..."
	 */
	protected static parseData(data: string): Record<string, string> {
		return data.split("&").reduce(
			(acc, pair) => {
				const [key, value] = pair.split("=");
				if (key && value !== undefined) {
					acc[key] = value;
				}
				return acc;
			},
			{} as Record<string, string>,
		);
	}

	/**
	 * 共通バリデーション
	 */
	protected static validateCommonFields(params: {
		data?: string;
		userId?: string;
		replyToken?: string;
	}): string[] {
		const errors: string[] = [];

		if (!params.data || params.data.trim() === "") {
			errors.push("data is required and cannot be empty");
		}
		if (!params.userId || params.userId.trim() === "") {
			errors.push("userId is required and cannot be empty");
		}
		if (!params.replyToken || params.replyToken.trim() === "") {
			errors.push("replyToken is required and cannot be empty");
		}

		return errors;
	}

	/**
	 * バリデーションエラーがある場合に例外をスロー
	 */
	protected static throwIfErrors(errors: string[], context: string): void {
		if (errors.length > 0) {
			throw new ServerErrorException(`Invalid postback event data: ${context}`, 400, errors);
		}
	}
}
