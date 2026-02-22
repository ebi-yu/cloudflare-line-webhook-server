/**
 * LINE APIへの実際の送信テスト
 *
 * このテストは実際にLINE Messaging APIを呼び出します。
 * テストを実行すると、設定されたユーザーIDに実際にメッセージが送信されます。
 *
 * 実行方法:
 * pnpm test:integration
 */

import {
	sendFlexMessage,
	sendTextMessage,
} from "@shared/domain/line/infrastructure/line-api-client/lineApiClient";
import { ButtonMenuFlexContainerVo, ButtonMenuItem } from "@shared/domain/line/infrastructure/vo";
import { beforeAll, describe, expect, it } from "vitest";
import { IntegrationTestEnv, loadTestEnv } from "./setup";

describe("LINE API 統合テスト", () => {
	let env: IntegrationTestEnv;

	beforeAll(() => {
		env = loadTestEnv();
		console.log(`\n📱 統合テストを実行します`);
		console.log(`送信先ユーザーID: ${env.LINE_OWN_USER_ID}\n`);
	});

	it("テキストメッセージを送信できる", async () => {
		const testMessage = "[統合テスト] テキストメッセージのテスト";

		await sendTextMessage(env.LINE_OWN_USER_ID, testMessage, env.LINE_CHANNEL_TOKEN);

		// エラーが発生しなければ成功
		expect(true).toBe(true);
		console.log(`✅ テキストメッセージを送信しました: "${testMessage}"`);
	}, 10000); // タイムアウトを10秒に設定

	it("クイックリプライ付きメッセージを送信できる", async () => {
		const testMessage = "[統合テスト] クイックリプライのテスト";
		const quickReply = {
			items: [
				{
					type: "action",
					action: {
						type: "postback",
						label: "はい",
						data: "action=yes",
					},
				},
				{
					type: "action",
					action: {
						type: "postback",
						label: "いいえ",
						data: "action=no",
					},
				},
			],
		};

		await sendTextMessage(env.LINE_OWN_USER_ID, testMessage, env.LINE_CHANNEL_TOKEN, quickReply);

		expect(true).toBe(true);
		console.log(`✅ クイックリプライ付きメッセージを送信しました`);
	}, 10000);

	it("大量のボタンがあるFlexメッセージ（カルーセル）を送信できる", async () => {
		// 15個のボタンを作成（カルーセル表示になる）
		const buttons: ButtonMenuItem[] = Array.from({ length: 15 }, (_, i) => ({
			label: `テスト項目${i + 1}`,
			type: "postback" as const,
			data: `type=test&id=${i + 1}`,
		}));

		const flexContainer = ButtonMenuFlexContainerVo.create(buttons);
		await sendFlexMessage(
			env.LINE_OWN_USER_ID,
			"[統合テスト] カルーセル形式のFlexメッセージ",
			flexContainer.container,
			env.LINE_CHANNEL_TOKEN,
		);

		expect(true).toBe(true);
		console.log(`✅ カルーセル形式のFlexメッセージ（ボタン${buttons.length}個）を送信しました`);
	}, 10000);
});
