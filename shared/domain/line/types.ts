// 基本イベント型
export interface LineEvent {
	replyToken?: string;
	type: string;
	mode?: string;
	timestamp?: number;
	source?: LineEventSource;
	webhookEventId?: string;
	deliveryContext?: {
		isRedelivery: boolean;
	};
	message?: LineMessage;
	postback?: {
		data: string;
		params?: Record<string, string>;
	};
}

// メッセージの送信元情報
export type LineEventSource =
	| { type: "user"; userId: string }
	| { type: "group"; groupId: string; userId?: string }
	| { type: "room"; roomId: string; userId?: string };

// メッセージの型
export interface LineMessage {
	id?: string;
	type: string;
	quoteToken?: string;
	text?: string;
	emojis?: LineEmoji[];
	mention?: LineMention;
}

// メッセージに含まれる絵文字の情報
export interface LineEmoji {
	index: number;
	length: number;
	productId: string;
	emojiId: string;
}

// メンション情報
export interface LineMention {
	mentions: LineMention[];
}

// メンションされたユーザー
export interface LineMention {
	index: number;
	length: number;
	type?: string;
	userId?: string;
}
