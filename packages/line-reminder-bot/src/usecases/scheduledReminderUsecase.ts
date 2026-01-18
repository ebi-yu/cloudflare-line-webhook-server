import { sendPushMessage } from '@shared/line/infrastructure/lineApiClient';
import { deleteReminder, getDueReminders } from '../infrastructure/reminderRepository';

/**
 * スケジュール実行時の期限が来たリマインダーを処理するユースケース
 */
export async function processScheduledReminders(env: any): Promise<void> {
	try {
		console.log('Checking due reminders...');
		const dueReminders = await getDueReminders(env.DB);

		console.log(`Found ${dueReminders.length} due reminders`);

		for (const reminder of dueReminders) {
			try {
				// リマインドメッセージを送信（間隔ラベルを含む）
				const label = reminder.intervalLabel ? `[${reminder.intervalLabel}] ` : '';
				const quickReply = {
					items: [
						{
							type: 'action',
							action: {
								type: 'postback',
								label: 'リマインド削除',
								data: `type=delete&groupId=${reminder.groupId}`,
							},
						},
					],
				};
				await sendPushMessage(reminder.userId, `🔔 リマインド ${label}\n\n${reminder.message}`, env.LINE_CHANNEL_TOKEN, quickReply);

				// このリマインダーを削除（他の間隔のリマインダーは保持される）
				await deleteReminder(env.DB, reminder.id, reminder.userId);
			} catch (error) {
				console.error(`Error processing reminder ${reminder.id}:`, error);
			}
		}
	} catch (error) {
		console.error('Error in scheduled handler:', error);
	}
}
