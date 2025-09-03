import { BetterAuth, type AuthFunctions, type PublicAuthFunctions } from '@convex-dev/better-auth';
import { api, components, internal } from './_generated/api.js';
import { query } from './_generated/server.js';
import type { Id, DataModel } from './_generated/dataModel.js';

const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

export const betterAuthComponent = new BetterAuth(components.betterAuth, {
	authFunctions,
	publicAuthFunctions
});

export const { createUser, updateUser, deleteUser, createSession, isAuthenticated } =
	betterAuthComponent.createAuthFunctions<DataModel>({
		onCreateUser: async (ctx, user) => {
			const userId = await ctx.db.insert('users', {
				email: user.email,
				name: user.name,
				role: 'user'
			});

			return userId;
		},

		onUpdateUser: async (ctx, user) => {
			await ctx.db.patch(user.userId as Id<'users'>, {
				email: user.email,
				name: user.name
			});
		},

		onDeleteUser: async (ctx, userId) => {
			await ctx.db.delete(userId as Id<'users'>);
		}
	});

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const userMetadata = await betterAuthComponent.getAuthUser(ctx);
		if (!userMetadata) {
			return null;
		}

		const user = await ctx.db.get(userMetadata.userId as Id<'users'>);
		return {
			...user,
			...userMetadata
		};
	}
});
