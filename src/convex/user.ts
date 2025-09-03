import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuthComponent } from './auth';

export const getUserRole = query({
  handler: async (ctx, args) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) {
      throw new Error("User not found");
    }

    return user.role;
  },
});
