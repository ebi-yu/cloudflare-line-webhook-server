import { LineWebhookConfig, sendReply, validateLineWebhook } from '@shared/line';
import { createReminder } from '../interface/reminderRepository';
import { Env, ReminderInput } from '../types';
import { ConfigurationError, LineConfig } from '../vo/LineConfig';

// デフォルトのリマインド間隔（分単位）
const DEFAULT_REMINDER_INTERVALS = [
	{ minutes: 30, label: '30分後' },
	{ minutes: 1440, label: '1日後' }, // 24 * 60
	{ minutes: 4320, label: '3日後' }, // 3 * 24 * 60
	{ minutes: 10080, label: '7日後' }, // 7 * 24 * 60
	{ minutes: 43200, label: '30日後' }, // 30 * 24 * 60
];

/**
 * LINE Webhookを処理するユースケース
 */
export async function handleLineWebhook(request: Request, env: Env): Promise<Response> {
	try {
		// 環境変数の検証
		const config = LineConfig.create(env);
		const webhookConfig = LineWebhookConfig.create({
			channelSecret: config.channelSecret,
			channelToken: config.channelToken,
			allowedUserId: config.ownUserId,
		});

		const result = await validateLineWebhook(request, webhookConfig);

		if (!result.success) {
			return result.response;
		}

		const { message, userId, replyToken } = result.event;
		const responseMessage = await createMemoReminder(message, userId, env);
		await sendReply(replyToken, responseMessage, config.channelToken);

		return new Response('OK', { status: 200 });
	} catch (error) {
		if (error instanceof ConfigurationError) {
			console.error('Configuration error:', error.errors);
			return new Response('Server configuration error: Missing required environment variables', { status: 500 });
		}
		console.error('Error handling webhook:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
}

/**
 * LINEメッセージをリマインドとして登録
 * 5分、1日、3日、7日、30日後にそれぞれリマインドを作成
 */
async function createMemoReminder(message: string, userId: string, env: Env): Promise<string> {
	const trimmed = message.trim();

	// メッセージが空の場合
	if (!trimmed) {
		return 'リマインドメッセージを入力してください。';
	}

	const now = Date.now();
	const results: string[] = [];
	const groupId = crypto.randomUUID(); // 同じメッセージの複数リマインドをグループ化

	// 各間隔でリマインドを作成
	for (const interval of DEFAULT_REMINDER_INTERVALS) {
		const executionTime = now + interval.minutes * 60 * 1000;
		const input: ReminderInput = {
			message: trimmed,
			executionTime,
			intervalLabel: interval.label,
			groupId,
		};

		await createReminder(env.DB, userId, input);
		const dateStr = new Date(executionTime).toLocaleString('ja-JP', {
			timeZone: 'Asia/Tokyo',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
		results.push(`${interval.label} (${dateStr})`);
	}

	return `✅ リマインド登録

📝 ${trimmed}

📅 通知予定:
${results.map((r) => `・ ${r}`).join('\n')}`;
}
