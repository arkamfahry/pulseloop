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

export const removeSentimentCount = internalMutation({
	args: {
		sentiment: v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const existing = await ctx.db.query('sentiments').first();

		if (!existing) {
			return null;
		}

		await ctx.db.patch(existing._id, {
			positive:
				args.sentiment === 'positive'
					? Math.max((existing.positive ?? 0) - 1, 0)
					: (existing.positive ?? 0),
			negative:
				args.sentiment === 'negative'
					? Math.max((existing.negative ?? 0) - 1, 0)
					: (existing.negative ?? 0),
			neutral:
				args.sentiment === 'neutral'
					? Math.max((existing.neutral ?? 0) - 1, 0)
					: (existing.neutral ?? 0)
		});

		return null;
	}
});
