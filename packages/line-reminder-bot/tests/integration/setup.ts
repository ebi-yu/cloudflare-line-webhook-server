/**
 * 統合テスト用のセットアップとヘルパー関数
 */
import { env as cloudflareEnv } from 'cloudflare:test';

export interface IntegrationTestEnv {
	LINE_CHANNEL_TOKEN: string;
	LINE_CHANNEL_SECRET: string;
	LINE_OWN_USER_ID: string;
	DB: D1Database;
}

/**
 * テスト用の環境変数をロード
 * .dev.vars ファイルから環境変数を読み込む
 */
export function loadTestEnv(): IntegrationTestEnv {
	const token = cloudflareEnv.LINE_CHANNEL_TOKEN;
	const secret = cloudflareEnv.LINE_CHANNEL_SECRET;
	const userId = cloudflareEnv.LINE_OWN_USER_ID;
	const db = cloudflareEnv.DB;

	if (!token || !secret || !userId) {
		throw new Error(
			'環境変数が設定されていません。.dev.vars ファイルを確認してください。\n' +
				'必要な変数: LINE_CHANNEL_TOKEN, LINE_CHANNEL_SECRET, LINE_OWN_USER_ID',
		);
	}

	return {
		LINE_CHANNEL_TOKEN: token,
		LINE_CHANNEL_SECRET: secret,
		LINE_OWN_USER_ID: userId,
		DB: db,
	};
}

/**
 * テスト用のダミーreplyTokenを生成
 * 注意: Reply APIは実際のイベントに対してしか使えないため、
 * 統合テストではPush APIを使用することを推奨
 */
export function generateDummyReplyToken(): string {
	return 'dummy-reply-token-for-testing';
}
