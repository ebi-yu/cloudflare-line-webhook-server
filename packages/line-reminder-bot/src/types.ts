import { LineWebhookEvent } from '@shared/line';

export interface Env {
	DB: D1Database;
	LINE_CHANNEL_TOKEN: string;
	LINE_CHANNEL_SECRET: string;
	LINE_OWN_USER_ID: string;
}

export interface Reminder {
	id: string;
	userId: string;
	message: string;
	executionTime: number; // 実行時刻（Unix timestamp in milliseconds）
	createdAt: number; // 作成日時（Unix timestamp in milliseconds）
	groupId?: string; // リマインダーグループID（同じメッセージの複数リマインドをグループ化）
	intervalLabel?: string; // リマインド間隔のラベル（例: '1分後', '1日後'）
}

export interface ReminderInput {
	message: string;
	executionTime: number;
	groupId?: string;
	intervalLabel?: string;
}

export type { LineWebhookEvent };
