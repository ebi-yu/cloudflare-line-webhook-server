import { isTextMessageEvent, LineWebhookValidator } from '@shared/line/infrastructure/lineWebhookValidator';
import { checkUserAuthorization } from '@shared/line/usecase/checkUserAuthorization';
import { LineTextMessageEventVo } from '@shared/line/vo/LineTextMessageEventVo';
import { LineWebhookConfigVo } from '@shared/line/vo/LineWebhookConfigVo';
import { ServerErrorException } from '@shared/utils/ServerErrorException';
import { recordMemoFromLine } from './usecase/LineWebhookToGithubUsecase';

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

			// 3. イベントタイプのチェック（テキストメッセージ以外はスキップ）
			if (!isTextMessageEvent(event)) {
				return new Response('Unsupported event type', { status: 400 });
			}

			// 4. LineTextMessageEventVoへの変換
			const messageEvent = LineTextMessageEventVo.create({
				message: event.message.text,
				userId: event.source?.userId,
				replyToken: event.replyToken,
			});

			// 5. ユーザー認証
			await checkUserAuthorization({ userId: messageEvent.userId, replyToken: messageEvent.replyToken, config });

			// 6. ビジネスロジック実行
			await recordMemoFromLine({ message: messageEvent.message, replyToken: messageEvent.replyToken, env });

			return new Response('OK', { status: 200 });
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
					}
				);
			}
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};
