/**
 * ログレベルの定義
 */
export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
}

/**
 * ログメッセージを出力する
 * @param level ログレベル
 * @param message メッセージ
 * @param data 追加データ（オプション）
 */
export function log(level: LogLevel, message: string, data?: any): void {
	const timestamp = new Date().toISOString();
	const prefix = getLogPrefix(level);

	if (data) {
		console[level](`${prefix} ${message}`, data);
	} else {
		console[level](`${prefix} ${message}`);
	}
}

/**
 * ログレベルに応じたプレフィックスを取得する
 */
function getLogPrefix(level: LogLevel): string {
	switch (level) {
		case LogLevel.DEBUG:
			return '🔍';
		case LogLevel.INFO:
			return '📩';
		case LogLevel.WARN:
			return '⚠️';
		case LogLevel.ERROR:
			return '❌';
		default:
			return '';
	}
}

/**
 * デバッグログを出力する
 */
export function debug(message: string, data?: any): void {
	log(LogLevel.DEBUG, message, data);
}

/**
 * 情報ログを出力する
 */
export function info(message: string, data?: any): void {
	log(LogLevel.INFO, message, data);
}

/**
 * 警告ログを出力する
 */
export function warn(message: string, data?: any): void {
	log(LogLevel.WARN, message, data);
}

/**
 * エラーログを出力する
 */
export function error(message: string, data?: any): void {
	log(LogLevel.ERROR, message, data);
}
