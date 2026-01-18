import { error as logError } from './logger';

/**
 * HTTPエラーレスポンスを生成する
 */
export function createErrorResponse(message: string, status: number, logData?: any): Response {
	logError(message, logData);
	return new Response(message, { status });
}

/**
 * 成功レスポンスを生成する
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

/**
 * エラークラス
 */
export class AppError extends Error {
	constructor(public message: string, public statusCode: number, public logData?: any) {
		super(message);
		this.name = 'AppError';
	}
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
	constructor(message: string, logData?: any) {
		super(message, 400, logData);
		this.name = 'ValidationError';
	}
}

/**
 * 認証エラー
 */
export class AuthenticationError extends AppError {
	constructor(message: string, logData?: any) {
		super(message, 401, logData);
		this.name = 'AuthenticationError';
	}
}

/**
 * サーバーエラー
 */
export class InternalServerError extends AppError {
	constructor(message: string, logData?: any) {
		super(message, 500, logData);
		this.name = 'InternalServerError';
	}
}

/**
 * エラーをResponseに変換する
 */
export function handleError(err: unknown): Response {
	if (err instanceof AppError) {
		return createErrorResponse(err.message, err.statusCode, err.logData);
	}

	if (err instanceof Error) {
		return createErrorResponse('Internal Server Error', 500, { error: err.message, stack: err.stack });
	}

	return createErrorResponse('Unknown Error', 500, { error: err });
}
