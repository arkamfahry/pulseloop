import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

export const addTopics = internalMutation({
	args: {
		topics: v.array(v.string()),
		feedbackId: v.id('feedbacks')
	},
	handler: async (ctx, args) => {
		for (const topic of args.topics) {
			const existing = await ctx.db
				.query('topics')
				.withIndex('by_topic', (q) => q.eq('topic', topic))
				.unique();

			if (!existing) {
				const _id = await ctx.db.insert('topics', {
					topic: topic
				});

				await ctx.db.insert('feedbackTopics', {
					feedbackId: args.feedbackId,
					topicId: _id
				});
			} else {
				await ctx.db.insert('feedbackTopics', {
					feedbackId: args.feedbackId,
					topicId: existing._id
				});
			}
		}
	}
});

export const removeTopics = internalMutation({
	args: {
		topics: v.array(v.string()),
		feedbackId: v.id('feedbacks')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		for (const topic of args.topics) {
			const existing = await ctx.db
				.query('topics')
				.withIndex('by_topic', (q) => q.eq('topic', topic))
				.unique();

			if (!existing) {
				continue;
			}

			const feedbackTopic = await ctx.db
				.query('feedbackTopics')
				.withIndex('by_feedbackId_topicId', (q) =>
					q.eq('feedbackId', args.feedbackId).eq('topicId', existing._id)
				)
				.unique();

			if (feedbackTopic) {
				await ctx.db.delete(feedbackTopic._id);
			}
		}
	}
});
