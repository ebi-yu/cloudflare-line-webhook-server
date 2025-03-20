// LINE Webhookのイベント全体
export interface LineWebhookEvent {
	destination: string;
	events: LineEvent[];
}

// 各イベント
export interface LineEvent {
	replyToken: string;
	type: string;
	mode: string;
	timestamp: number;
	source: LineEventSource;
	webhookEventId: string;
	deliveryContext: {
		isRedelivery: boolean;
	};
	message: LineMessage;
}

// メッセージの送信元情報
export type LineEventSource =
	| { type: 'user'; userId: string }
	| { type: 'group'; groupId: string; userId?: string }
	| { type: 'room'; roomId: string; userId?: string };

// メッセージの型
export interface LineMessage {
	id: string;
	type: string;
	quoteToken?: string;
	text: string;
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
	mentionees: LineMentionee[];
}

// メンションされたユーザー
export interface LineMentionee {
	index: number;
	length: number;
	type: string;
	userId?: string;
	isSelf?: boolean;
}
