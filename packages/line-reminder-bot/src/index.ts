import { checkUserAuthorization } from '@shared/domain/line/application/checkUserAuthorization';
import { isPostbackEvent, isTextMessageEvent, LineWebhookValidator } from '@shared/domain/line/infrastructure/lineWebhookValidator';
import { LinePostbackDeleteReminderEventVo } from '@shared/domain/line/infrastructure/vo/LinePostbackDeleteReminderEventVo';
import { LineTextMessageEventVo } from '@shared/domain/line/infrastructure/vo/LineTextMessageEventVo';
import { LineWebhookConfigVo } from '@shared/domain/line/infrastructure/vo/LineWebhookConfigVo';
import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { createReminderFromLine, deleteReminderFromLine } from './usecases/lineWebhookToReminderUsecase';
import { processScheduledReminders } from './usecases/scheduledReminderUsecase';

// リクエストデータの検証とビジネスロジックの呼び出し
export default {
	async fetch(request: Request, env: Record<string, any>): Promise<Response> {
		try {
			// 1. Webhook設定の生成
			const config = LineWebhookConfigVo.create({
				channelSecret: env.LINE_CHANNEL_SECRET,
				channelToken: env.LINE_CHANNEL_TOKEN,
				allowedUserId: env.LINE_OWN_USER_ID,
			});

			// 2. Webhook検証とイベント抽出
			const { event } = await LineWebhookValidator.validateWebhookRequest(request, config);

			// レマインダーの登録
			if (isTextMessageEvent(event)) {
				// 4. LineTextMessageEventVoへの変換
				const messageEvent = LineTextMessageEventVo.create({
					message: event.message.text,
					userId: event.source?.userId,
					replyToken: event.replyToken,
				});

				// 5. ユーザー認証
				await checkUserAuthorization({
					userId: messageEvent.userId,
					replyToken: messageEvent.replyToken,
					config,
				});

				// 6. ビジネスロジック実行
				await createReminderFromLine({
					message: messageEvent.message,
					userId: messageEvent.userId,
					replyToken: messageEvent.replyToken,
					env,
				});

				return new Response('OK', { status: 200 });
			}

			// レマインダーの削除
			if (isPostbackEvent(event)) {
				// 4. LinePostbackDeleteReminderEventVoへの変換
				const postBackEvent = LinePostbackDeleteReminderEventVo.create({
					data: event.postback.data,
					userId: event.source?.userId,
					replyToken: event.replyToken,
				});

				// 5. ビジネスロジック実行
				await deleteReminderFromLine({
					groupId: postBackEvent.groupId || '',
					userId: postBackEvent.userId || '',
					replyToken: postBackEvent.replyToken,
					env,
				});

				return new Response('OK', { status: 200 });
			}

			throw new ServerErrorException('Unsupported event type', 400);
		} catch (error) {
			console.error('Error handling webhook:', error);
			if (error instanceof ServerErrorException) {
				return new Response(
					JSON.stringify({
						message: error.message,
						errors: error.errors,
					}),
					{
						status: error.statusCode,
						headers: { 'Content-Type': 'application/json' },
					},
				);
			}
			return new Response('Internal Server Error', { status: 500 });
		}
	},

	async scheduled(event: ScheduledEvent, env: Record<string, any>, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(processScheduledReminders(env));
	},
};
