import { ServerErrorException } from '../../../../../utils/ServerErrorException';

/**
 * LINE Webhook署名のVO
 * 署名検証のロジックを担当
 */
export class LineWebhookSignatureVo {
	private constructor(
		private readonly signature: string,
		private readonly bodyText: string,
		private readonly secret: string,
	) {}

	/**
	 * リクエストから署名情報を作成
	 */
	static async createFromRequest(request: Request, secret: string): Promise<LineWebhookSignatureVo> {
		const signature = request.headers.get('x-line-signature');
		if (!signature) {
			throw new ServerErrorException('Missing signature header', 401);
		}

		const bodyText = await request.text();
		return new LineWebhookSignatureVo(signature, bodyText, secret);
	}

	/**
	 * 署名の検証
	 * HMAC-SHA256を使用してボディと署名を検証
	 */
	async validate(): Promise<boolean> {
		try {
			const encoder = new TextEncoder();
			const keyData = encoder.encode(this.secret);
			const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

			// HMAC-SHA256 の署名を計算
			const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(this.bodyText));
			const hashArray = Array.from(new Uint8Array(signatureBytes));
			const computedSignature = btoa(String.fromCharCode(...hashArray)); // Base64 エンコード

			return computedSignature === this.signature;
		} catch (error) {
			console.error('Signature validation error:', error);
			return false;
		}
	}

	/**
	 * ボディテキストを取得
	 */
	getBodyText(): string {
		return this.bodyText;
	}
}
