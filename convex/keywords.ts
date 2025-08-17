import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const upsertKeyword = internalMutation({
  args: {
    keywords: v.array(v.string()),
    sentiment: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral"),
    ),
  },
  handler: async (ctx, args) => {
    for (const keyword of args.keywords) {
      const existing = await ctx.db
        .query("keywords")
        .withIndex("by_keyword", (q) => q.eq("keyword", keyword))
        .first();

      if (!existing) {
        await ctx.db.insert("keywords", {
          keyword: keyword,
          count: 1,
          sentiment: {
            positive: args.sentiment === "positive" ? 1 : 0,
            negative: args.sentiment === "negative" ? 1 : 0,
            neutral: args.sentiment === "neutral" ? 1 : 0,
          },
        });
      } else {
        await ctx.db.patch(existing._id, {
          count: (existing.count || 0) + 1,
          sentiment: {
            positive:
              (existing.sentiment?.positive || 0) +
              (args.sentiment === "positive" ? 1 : 0),
            negative:
              (existing.sentiment?.negative || 0) +
              (args.sentiment === "negative" ? 1 : 0),
            neutral:
              (existing.sentiment?.neutral || 0) +
              (args.sentiment === "neutral" ? 1 : 0),
          },
        });
      }
    }
  },
});
