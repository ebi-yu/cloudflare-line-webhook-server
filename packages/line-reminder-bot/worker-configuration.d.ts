import { D1Database } from '@cloudflare/workers-types/experimental';

interface Env {
	DB: D1Database;
	LINE_CHANNEL_TOKEN: string;
	LINE_CHANNEL_SECRET: string;
	LINE_OWN_USER_ID: string;
}

// cloudflare:test の ProvidedEnv に Env を反映させる
declare module 'cloudflare:test' {
	interface ProvidedEnv extends Env {}
}
