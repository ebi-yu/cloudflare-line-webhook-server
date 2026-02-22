import type { ExecutionContext, ScheduledEvent } from '@cloudflare/workers-types';
import { checkUserAuthorization } from '@shared/domain/line/application/checkUserAuthorization';
import { LineWebhookConfigVo, LineWebhookRequestVo } from '@shared/domain/line/infrastructure/vo';
import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { handleCreateReminder } from './controllers/createReminderController';
import { handleDeleteReminder } from './controllers/deleteReminderController';
import { handleGetReminderDetail } from './controllers/getReminderDetailController';
import { handleGetReminderList } from './controllers/getReminderListController';
import { processScheduledReminders } from './usecases/processScheduledRemindersUsecase';

// HTTPリクエストの受け取り、Webhook署名検証、イベントルーティング
export default {
	async fetch(request: Request, env: Record<string, any>): Promise<Response> {
		try {
			// 1. Webhook設定の生成（環境変数から）
			const config = LineWebhookConfigVo.create({
				channelSecret: env.LINE_CHANNEL_SECRET,
				channelToken: env.LINE_CHANNEL_TOKEN,
				allowedUserId: env.LINE_OWN_USER_ID,
			});

			// 2. Webhook署名検証とイベント抽出（セキュリティ）
			const webhookRequest = await LineWebhookRequestVo.createFromRequest(request, config);
			const event = webhookRequest.event;

			// 3. ユーザー認証（全イベント共通）
			await checkUserAuthorization({
				userId: event.source?.userId ?? '',
				replyToken: event.replyToken ?? '',
				config,
			});

			// 4. イベントタイプによるルーティング（テキストメッセージ → リマインダー作成）
			if (LineWebhookRequestVo.isTextMessageEvent(event)) {
				await handleCreateReminder({ event, env });
				return new Response('OK', { status: 200 });
			}

			// 5. Postbackイベントのルーティング
			if (LineWebhookRequestVo.isPostbackEvent(event)) {
				const parsedParams = new URLSearchParams(event.postback.data);

				if (parsedParams.get('type') === 'list') {
					await handleGetReminderList({ event, env });
					return new Response('OK', { status: 200 });
				}

				if (parsedParams.get('type') === 'detail') {
					await handleGetReminderDetail({ event, env });
					return new Response('OK', { status: 200 });
				}

				if (parsedParams.get('type') === 'delete') {
					await handleDeleteReminder({ event, env });
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

	async scheduled(_event: ScheduledEvent, env: Record<string, any>, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(processScheduledReminders(env));
	},
};
