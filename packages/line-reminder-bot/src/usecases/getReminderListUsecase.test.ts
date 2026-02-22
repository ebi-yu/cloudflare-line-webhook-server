/**
 * getReminderListUsecaseのユニットテスト
 *
 * LINE APIをモックせずに、純粋なビジネスロジックをテスト
 */

import { env } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getReminderList } from "../../src/usecases/getRemindersListUsecase";

describe("getReminderList ユースケース", () => {
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

	it("(given) リマインダーが1件も登録されていないとき、 (when) getReminderListを実行すると、 (then) 空配列が返される", async () => {
		// Arrange
		const userId = "test-user-123";

		// Act
		const result = await getReminderList({ userId, db: env.DB });

		// Assert
		expect(result).toEqual([]);
	});

	it("(given) 同じgroupIdを持つリマインダーが複数登録されているとき、 (when) getReminderListを実行すると、 (then) groupIdで重複を除いた一覧が返される", async () => {
		// Arrange
		const now = new Date();
		const future = new Date(now.getTime() + 3600000);
		await env.DB.prepare(
			"INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("reminder-1", "test-user-123", "テスト1", future.getTime(), now.getTime(), "group-1")
			.run();
		await env.DB.prepare(
			"INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind(
				"reminder-2",
				"test-user-123",
				"テスト1",
				future.getTime() + 86400000,
				now.getTime(),
				"group-1",
			)
			.run();
		await env.DB.prepare(
			"INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("reminder-3", "test-user-123", "テスト2", future.getTime(), now.getTime(), "group-2")
			.run();

		// Act
		const result = await getReminderList({ userId: "test-user-123", db: env.DB });

		// Assert
		expect(result).toHaveLength(2);
		expect(result[0].message).toBe("テスト1");
		expect(result[1].message).toBe("テスト2");
	});

	it("(given) 自分と別ユーザーのリマインダーが登録されているとき、 (when) getReminderListを実行すると、 (then) 自分のリマインダーのみが返される", async () => {
		// Arrange
		const now = new Date();
		const future = new Date(now.getTime() + 3600000);
		await env.DB.prepare(
			"INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("reminder-1", "test-user-123", "テスト1", future.getTime(), now.getTime(), "group-1")
			.run();
		await env.DB.prepare(
			"INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("reminder-2", "other-user", "テスト2", future.getTime(), now.getTime(), "group-2")
			.run();

		// Act
		const result = await getReminderList({ userId: "test-user-123", db: env.DB });

		// Assert
		expect(result).toHaveLength(1);
		expect(result[0].message).toBe("テスト1");
	});
});
