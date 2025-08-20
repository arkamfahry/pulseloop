import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';
import { workflow } from '.';

export const submitFeedback = mutation({
	args: {
		content: v.string()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const feedbackId = await ctx.db.insert('feedbacks', {
			content: args.content,
			user: userId,
			isPublished: false
		});

		const feedback = await ctx.db.get(feedbackId);
		if (!feedback) {
			throw new Error('Feedback not found');
		}

		await workflow.start(
			ctx,
			internal.analysis.feedbackAnalysisWorkflow,
			{
				feedbackId: feedback._id,
				content: feedback.content
			},
			{
				onComplete: internal.workflow.cleanupWorkflow,
				context: null
			}
		);
	}
});

export const setFeedbackApproval = internalMutation({
	args: {
		feedbackId: v.id('feedbacks'),
		approval: v.union(v.literal('approved'), v.literal('rejected'))
	},
	handler: async (ctx, args) => {
		if (args.approval === 'approved') {
			await ctx.db.patch(args.feedbackId, {
				approval: args.approval
			});

			const feedback = await ctx.db.get(args.feedbackId);
			if (!feedback) {
				throw new Error('Feedback not found');
			}
		} else {
			await ctx.db.patch(args.feedbackId, {
				approval: args.approval
			});
		}
	}
});

export const publishFeedback = internalMutation({
	args: {
		feedbackId: v.id('feedbacks'),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		topics: v.optional(v.array(v.string()))
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.feedbackId, {
			sentiment: args.sentiment,
			topics: args.topics,
			isPublished: true
		});
	}
});

export const attachFeedbackEmbedding = internalMutation({
	args: {
		feedbackId: v.id('feedbacks'),
		embedding: v.array(v.number())
	},
	handler: async (ctx, args) => {
		const feedback = await ctx.db.get(args.feedbackId);
		if (!feedback) {
			throw new Error('Feedback not found');
		}

		const embeddingId = await ctx.db.insert('feedbackEmbeddings', {
			user: feedback.user,
			embedding: args.embedding,
			sentiment: feedback.sentiment,
			topics: feedback.topics
		});

		await ctx.db.patch(args.feedbackId, {
			embeddingId: embeddingId
		});
	}
});

export const toggleFeedbackVote = mutation({
	args: {
		feedbackId: v.id('feedbacks')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const existing = await ctx.db
			.query('votes')
			.withIndex('by_feedback_user', (q) => q.eq('feedback', args.feedbackId).eq('user', userId))
			.first();

		const post = await ctx.db.get(args.feedbackId);

		if (!post) {
			throw new Error('Feedback not found');
		}

		if (!existing) {
			await ctx.db.insert('votes', {
				feedback: args.feedbackId,
				user: userId
			});

			await ctx.db.patch(args.feedbackId, {
				votes: (post.votes ?? 0) + 1
			});
		} else {
			await ctx.db.delete(existing._id);

			await ctx.db.patch(args.feedbackId, {
				votes: Math.max((post.votes ?? 0) - 1, 0)
			});
		}
	}
});

export const getFeedbackById = query({
	args: { feedbackId: v.id('feedbacks') },
	handler: async (ctx, args) => {
		const feedback = await ctx.db.get(args.feedbackId);
		return feedback;
	}
});

export const listPublishedFeedback = query({
	handler: async (ctx) => {
		return await ctx.db
			.query('feedbacks')
			.filter((q) => q.eq(q.field('isPublished'), true))
			.collect();
	}
});

export const getFeedbackByEmbeddingId = internalQuery({
	args: { embeddingId: v.id('feedbackEmbeddings') },
	handler: async (ctx, args) => {
		const feedback = await ctx.db
			.query('feedbacks')
			.withIndex('by_embeddingId', (q) => q.eq('embeddingId', args.embeddingId))
			.first();
		return feedback;
	}
});
