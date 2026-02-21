import { ServerErrorException } from '../../../utils/ServerErrorException';
import { sendReplyTextMessage } from '../infrastructure/line-api-client/lineApiClient';
import { LineWebhookConfigVo } from '../infrastructure/vo/webhook/LineWebhookConfigVo';

/**
 * ユーザー認証を行い、未認証の場合は例外を投げる
 * @throws {Error} 未認証の場合（errorにstatusCodeプロパティを追加）
 */
export async function checkUserAuthorization({
	userId,
	replyToken,
	config,
}: {
	userId: string;
	replyToken: string;
	config: LineWebhookConfigVo;
}): Promise<void> {
	if (!config.isAllowedUser(userId)) {
		await sendReplyTextMessage(replyToken, '認証されていないユーザーです。', config.channelToken);
		const error = new ServerErrorException('Unauthorized user', 403);
		error.statusCode = 403;
		throw error;
	}
}
