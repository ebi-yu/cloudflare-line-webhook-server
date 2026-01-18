export class ServerErrorException extends Error {
	statusCode: number;
	errors: string[];

	constructor(message: string, statusCode: number = 500, errors: string[] = []) {
		super(message);
		this.name = 'ServerErrorException';
		this.errors = errors;
		this.statusCode = statusCode;
	}
}
