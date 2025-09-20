import { convexAdapter } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth';
import { type GenericCtx } from '../convex/_generated/server.js';
import { betterAuthComponent } from '../convex/auth.js';

const siteUrl = process.env.SITE_URL;

export const createAuth = (ctx: GenericCtx) =>
	betterAuth({
		baseURL: siteUrl,
		database: convexAdapter(ctx, betterAuthComponent),

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false
		},

		plugins: [convex()]
	});
