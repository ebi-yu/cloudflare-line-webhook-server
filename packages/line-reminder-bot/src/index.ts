import { checkUserAuthorization } from '@shared/domain/line/application/checkUserAuthorization';
import { LineWebhookConfigVo, LineWebhookRequestVo } from '@shared/domain/line/infrastructure/vo';
import { LinePostbackDeleteReminderVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackDeleteReminderVo';
import { LineWebhookMessageVo } from '@shared/domain/line/infrastructure/vo/webhook/LineWebhookMessageVo';
import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { createReminderFromLine, deleteReminderFromLine } from './usecases/lineWebhookToReminderUsecase';
import { listRemindersForLine } from './usecases/listRemindersUsecase';
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
			const webhookRequest = await LineWebhookRequestVo.createFromRequest(request, config);
			const event = webhookRequest.event;

			// レマインダーの登録
			if (LineWebhookRequestVo.isTextMessageEvent(event)) {
				// 4. LineWebhookMessageVoへの変換
				const messageEvent = LineWebhookMessageVo.create({
					message: event.message!.text,
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
				// リマインド一覧コマンドの判定
				const trimmedMessage = messageEvent.message.trim();
				if (trimmedMessage === '一覧' || trimmedMessage === 'リスト' || trimmedMessage.toLowerCase() === 'list') {
					await listRemindersForLine({
						userId: messageEvent.userId,
						replyToken: messageEvent.replyToken,
						env,
					});
				} else {
					// 通常のリマインド登録
					await createReminderFromLine({
						message: messageEvent.message,
						userId: messageEvent.userId,
						replyToken: messageEvent.replyToken,
						env,
					});
				}

				return new Response('OK', { status: 200 });
			}

			// レマインダーの削除
			if (LineWebhookRequestVo.isPostbackEvent(event)) {
				// 4. LinePostbackDeleteReminderVoへの変換
				const postBackEvent = LinePostbackDeleteReminderVo.create({
					data: event.postback!.data,
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
