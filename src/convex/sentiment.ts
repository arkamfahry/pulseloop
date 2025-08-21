import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

export const updateSentimentCounts = internalMutation({
	args: {
		sentiment: v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db.query('sentiments').first();

		if (!existing) {
			await ctx.db.insert('sentiments', {
				positive: args.sentiment === 'positive' ? 1 : 0,
				negative: args.sentiment === 'negative' ? 1 : 0,
				neutral: args.sentiment === 'neutral' ? 1 : 0
			});
		} else {
			await ctx.db.patch(existing._id, {
				positive: (existing.positive ?? 0) + (args.sentiment === 'positive' ? 1 : 0),
				negative: (existing.negative ?? 0) + (args.sentiment === 'negative' ? 1 : 0),
				neutral: (existing.neutral ?? 0) + (args.sentiment === 'neutral' ? 1 : 0)
			});
		}
	}
});
