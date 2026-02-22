import { checkUserAuthorization } from '@shared/domain/line/application/checkUserAuthorization';
import { LineWebhookConfigVo, LineWebhookRequestVo } from '@shared/domain/line/infrastructure/vo';
import { LinePostbackDeleteReminderVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackDeleteReminderVo';
import { LinePostbackShowReminderListVo } from '@shared/domain/line/infrastructure/vo/postback/LinePostbackShowReminderListVo';
import { LineWebhookMessageVo } from '@shared/domain/line/infrastructure/vo/webhook/LineWebhookMessageVo';
import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { createReminderFromLine } from './usecases/createReminderUsecase';
import { deleteReminderFromLine } from './usecases/deleteReminderUsecase';
import { showReminderListFromLine } from './usecases/listRemindersUsecase';
import { processScheduledReminders } from './usecases/processScheduledRemindersUsecase';

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
				await createReminderFromLine({
					message: messageEvent.message,
					userId: messageEvent.userId,
					replyToken: messageEvent.replyToken,
					env,
				});

				return new Response('OK', { status: 200 });
			}

			// レマインダーの削除・一覧表示
			if (LineWebhookRequestVo.isPostbackEvent(event)) {
				const parsedParams = new URLSearchParams(event.postback!.data);

				// リマインダー一覧表示
				if (parsedParams.get('type') === 'list') {
					const postBackEvent = LinePostbackShowReminderListVo.create({
						data: event.postback!.data,
						userId: event.source?.userId,
						replyToken: event.replyToken,
					});

					// ユーザー認証
					await checkUserAuthorization({
						userId: postBackEvent.userId,
						replyToken: postBackEvent.replyToken,
						config,
					});

					// ビジネスロジック実行
					await showReminderListFromLine({
						userId: postBackEvent.userId,
						replyToken: postBackEvent.replyToken,
						env,
					});

					return new Response('OK', { status: 200 });
				}

				// レマインダーの削除
				if (parsedParams.get('type') === 'delete') {
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
