/**
 * UTF-8文字列をBase64エンコードする
 */
export function utf8ToBase64(str: string): string {
	const utf8Bytes = new TextEncoder().encode(str);
	let binary = '';
	utf8Bytes.forEach((byte) => {
		binary += String.fromCharCode(byte);
	});
	return btoa(binary);
}

/**
 * Base64文字列をUTF-8にデコードする
 */
export function base64ToUtf8(base64: string): string {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}
