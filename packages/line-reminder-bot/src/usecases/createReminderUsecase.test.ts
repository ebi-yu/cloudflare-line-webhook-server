/**
 * createReminderUsecaseのユニットテスト
 *
 * Controller層を分離したことで、LINE APIをモックせずに
 * ビジネスロジックのみをテストできるようになった
 */

import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createReminder } from "../../src/usecases/createReminderUsecase";

describe("createReminder ユースケース", () => {
	beforeAll(async () => {
		await env.DB.batch([
			env.DB.prepare(`
				CREATE TABLE IF NOT EXISTS reminders (
					id TEXT PRIMARY KEY,
					user_id TEXT NOT NULL,
					message TEXT NOT NULL,
					execution_time TEXT NOT NULL,
					created_at TEXT NOT NULL,
					group_id TEXT,
					interval_label TEXT
				)
			`),
		]);
	});

	beforeEach(async () => {
		await env.DB.prepare("DELETE FROM reminders").run();
	});

	it("(given) 有効なメッセージとユーザーIDが与えられたとき、 (when) createReminderを実行したとき、 (then) 5つのスケジュール済み時刻を含む結果が返される", async () => {
		// Arrange
		const message = "テストメッセージ";
		const userId = "test-user-123";

		// Act
		const result = await createReminder({ message, userId, db: env.DB });

		// Assert
		expect(result.message).toBe("テストメッセージ");
		expect(result.scheduledTimes).toHaveLength(5);
		expect(result.scheduledTimes[0].label).toBe("5分後");
		expect(result.scheduledTimes[1].label).toBe("1日後");
		expect(result.scheduledTimes[2].label).toBe("3日後");
		expect(result.scheduledTimes[3].label).toBe("7日後");
		expect(result.scheduledTimes[4].label).toBe("30日後");
		result.scheduledTimes.forEach((time) => {
			expect(time.dateTime).toBeInstanceOf(Date);
			expect(time.dateTime.getTime()).toBeGreaterThan(Date.now());
		});
	});

	it("(given) 前後に空白を含むメッセージが与えられたとき、 (when) createReminderを実行すると、 (then) トリムされたメッセージが返される", async () => {
		// Arrange
		const message = "  空白あり  ";
		const userId = "test-user-123";

		// Act
		const result = await createReminder({ message, userId, db: env.DB });

		// Assert
		expect(result.message).toBe("空白あり");
	});

	it("(given) 有効なメッセージとユーザーIDが与えられたとき、 (when) createReminderを実行すると、 (then) DBに5件のリマインダーが保存される", async () => {
		// Arrange
		const message = "テスト";
		const userId = "test-user-123";

		// Act
		await createReminder({ message, userId, db: env.DB });

		// Assert
		const count = await env.DB.prepare("SELECT COUNT(*) as count FROM reminders WHERE user_id = ?")
			.bind(userId)
			.first<{ count: number }>();
		expect(count?.count).toBe(5);
	});

	it("(given) 有効なメッセージとユーザーIDが与えられたとき、 (when) createReminderを実行すると、 (then) 全リマインダーが同じgroupIdを持つ", async () => {
		// Arrange
		const message = "テスト";
		const userId = "test-user-123";

		// Act
		await createReminder({ message, userId, db: env.DB });

		// Assert
		const reminders = await env.DB.prepare("SELECT group_id FROM reminders WHERE user_id = ?")
			.bind(userId)
			.all();
		const groupIds = reminders.results.map((r: any) => r.group_id);
		const uniqueGroupIds = new Set(groupIds);
		expect(uniqueGroupIds.size).toBe(1);
		expect(groupIds[0]).toBeTruthy();
	});
});
