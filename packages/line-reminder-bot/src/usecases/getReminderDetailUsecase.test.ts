/**
 * getReminderDetailUsecaseのユニットテスト
 *
 * LINE APIをモックせずに、純粋なビジネスロジックをテスト
 */

import { env } from 'cloudflare:test';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getReminderDetail } from '../../src/usecases/getReminderDetailUsecase';

describe('getReminderDetail ユースケース', () => {
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
		await env.DB.prepare('DELETE FROM reminders').run();
	});

	it('(given) 指定したgroupIdのリマインダーが存在しないとき、 (when) getReminderDetailを実行すると、 (then) nullが返される', async () => {
		// Arrange
		const groupId = 'non-existent-group';
		const userId = 'test-user-123';

		// Act
		const result = await getReminderDetail({ groupId, userId, db: env.DB });

		// Assert
		expect(result).toBeNull();
	});

	it('(given) 指定したgroupIdのリマインダーが複数登録されているとき、 (when) getReminderDetailを実行すると、 (then) メッセージと複数の実行時刻を含む詳細が返される', async () => {
		// Arrange
		const now = new Date();
		const future1 = new Date(now.getTime() + 3600000);
		const future2 = new Date(now.getTime() + 86400000);
		await env.DB.prepare(
			'INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id, interval_label) VALUES (?, ?, ?, ?, ?, ?, ?)',
		)
			.bind('reminder-1', 'test-user-123', 'テストメッセージ', future1.getTime(), now.getTime(), 'group-1', '1時間後')
			.run();
		await env.DB.prepare(
			'INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id, interval_label) VALUES (?, ?, ?, ?, ?, ?, ?)',
		)
			.bind('reminder-2', 'test-user-123', 'テストメッセージ', future2.getTime(), now.getTime(), 'group-1', '1日後')
			.run();

		// Act
		const result = await getReminderDetail({ groupId: 'group-1', userId: 'test-user-123', db: env.DB });

		// Assert
		expect(result).not.toBeNull();
		expect(result!.groupId).toBe('group-1');
		expect(result!.message).toBe('テストメッセージ');
		expect(result!.scheduledTimes).toHaveLength(2);
		expect(result!.scheduledTimes[0].label).toBe('1時間後');
		expect(result!.scheduledTimes[0].dateTime).toEqual(future1);
		expect(result!.scheduledTimes[1].label).toBe('1日後');
		expect(result!.scheduledTimes[1].dateTime).toEqual(future2);
	});

	it('(given) 別ユーザーの同じgroupIdのリマインダーが存在するとき、 (when) 自分のuserIdでgetReminderDetailを実行すると、 (then) nullが返される', async () => {
		// Arrange
		const now = new Date();
		const future = new Date(now.getTime() + 3600000);
		await env.DB.prepare(
			'INSERT INTO reminders (id, user_id, message, execution_time, created_at, group_id, interval_label) VALUES (?, ?, ?, ?, ?, ?, ?)',
		)
			.bind('reminder-1', 'other-user', 'テストメッセージ', future.getTime(), now.getTime(), 'group-1', '1時間後')
			.run();

		// Act
		const result = await getReminderDetail({ groupId: 'group-1', userId: 'test-user-123', db: env.DB });

		// Assert
		expect(result).toBeNull();
	});
});
