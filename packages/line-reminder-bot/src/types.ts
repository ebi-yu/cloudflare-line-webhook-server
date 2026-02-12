import { LineWebhookEvent } from '@shared/domain/line/types';

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
