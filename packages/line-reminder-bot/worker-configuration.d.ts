import { D1Database } from '@cloudflare/workers-types/experimental';

interface Env {
	DB: D1Database;
	LINE_CHANNEL_TOKEN: string;
	LINE_CHANNEL_SECRET: string;
	LINE_OWN_USER_ID: string;
}
