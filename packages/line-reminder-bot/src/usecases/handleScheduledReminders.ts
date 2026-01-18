import { sendPushMessage } from '@shared/line';
import { deleteReminder, getDueReminders } from '../interface/reminderRepository';
import { Env } from '../types';

/**
 * スケジュール実行時の期限が来たリマインダーを処理するユースケース
 */
export async function handleScheduledReminders(env: Env): Promise<void> {
	try {
		console.log('Checking due reminders...');
		const dueReminders = await getDueReminders(env.DB);

		console.log(`Found ${dueReminders.length} due reminders`);

		for (const reminder of dueReminders) {
			try {
				// リマインドメッセージを送信（間隔ラベルを含む）
				const label = reminder.intervalLabel ? `[${reminder.intervalLabel}] ` : '';
				await sendPushMessage(reminder.userId, `🔔 リマインド ${label}\n\n${reminder.message}`, env.LINE_CHANNEL_TOKEN);

				// このリマインダーを削除（他の間隔のリマインダーは保持される）
				await deleteReminder(env.DB, reminder.id, reminder.userId);
				console.log(`Reminder ${reminder.id} (${reminder.intervalLabel || 'no label'}) sent and deleted`);
			} catch (error) {
				console.error(`Error processing reminder ${reminder.id}:`, error);
			}
		}
	} catch (error) {
		console.error('Error in scheduled handler:', error);
	}
}
