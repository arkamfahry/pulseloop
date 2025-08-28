import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { betterAuthComponent } from './auth';
import { workflow } from '.';
import { OrderedQuery, paginationOptsValidator, Query, QueryInitializer } from 'convex/server';
import { DataModel, Id } from './_generated/dataModel';

export const submitFeedback = mutation({
	args: {
		content: v.string()
	},
	handler: async (ctx, args) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const feedbackId = await ctx.db.insert('feedbacks', {
			content: args.content,
			userId: userId as Id<'users'>,
			status: 'open',
			published: false
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
			published: true
		});

		if (args.topics && args.topics.length > 0 && args.sentiment) {
			await ctx.runMutation(internal.topics.addTopics, {
				topics: args.topics,
				feedbackId: args.feedbackId
			});
		}
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
			userId: feedback.userId,
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
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const feedback = await ctx.db.get(args.feedbackId);

		if (!feedback) {
			throw new Error('Feedback not found');
		}

		const vote = await ctx.db
			.query('votes')
			.withIndex('by_feedbackId_userId', (q) =>
				q.eq('feedbackId', feedback._id).eq('userId', userId as Id<'users'>)
			)
			.unique();

		if (!vote) {
			await ctx.db.insert('votes', {
				feedbackId: feedback._id,
				userId: userId as Id<'users'>
			});

			await ctx.db.patch(feedback._id, {
				votes: (feedback.votes ?? 0) + 1
			});
		} else {
			await ctx.db.delete(vote._id);

			await ctx.db.patch(feedback._id, {
				votes: Math.max((feedback.votes ?? 0) - 1, 0)
			});
		}
	}
});

export const deleteFeedback = mutation({
	args: {
		feedbackId: v.id('feedbacks')
	},
	handler: async (ctx, args) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			throw new Error('User not authenticated');
		}

		const feedback = await ctx.db.get(args.feedbackId);
		if (!feedback) {
			throw new Error('Feedback not found');
		}

		await ctx.db.delete(feedback._id);
		if (feedback.topics && feedback.topics.length > 0 && feedback.sentiment) {
			await ctx.runMutation(internal.topics.removeTopics, {
				topics: feedback.topics,
				feedbackId: args.feedbackId
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
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('feedbacks')
			.withIndex('by_published_votes', (q) => q.eq('published', true))
			.order('desc')
			.paginate(args.paginationOpts);
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

export const listUnpublishedFeedback = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, args) => {
		return await ctx.db
			.query('feedbacks')
			.withIndex('by_published_votes', (q) => q.eq('published', false))
			.order('desc')
			.paginate(args.paginationOpts);
	}
});

export const searchFeedback = query({
	args: {
		search: v.optional(v.string()),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		status: v.optional(v.union(v.literal('open'), v.literal('noted'))),
		topics: v.optional(v.array(v.string())),
		from: v.optional(v.int64()),
		to: v.optional(v.int64()),
		sort: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
		paginationOpts: paginationOptsValidator
	},
	handler: async (ctx, args) => {
		if (args.search) {
			const result = await ctx.db
				.query('feedbacks')
				.withSearchIndex('by_content', (q) => {
					let expr = q.search('content', args.search!).eq('published', true);
					if (args.sentiment) {
						expr = expr.eq('sentiment', args.sentiment);
					}
					if (args.status) {
						expr = expr.eq('status', args.status);
					}

					return expr;
				})
				.paginate(args.paginationOpts);

			if (args.from) {
				result.page = result.page.filter((q) => q._creationTime >= args.from!);
			}
			if (args.to) {
				result.page = result.page.filter((q) => q._creationTime <= args.to!);
			}

			if (args.sort) {
				result.page = result.page.sort((a, b) => {
					if (args.sort === 'asc') {
						return (a.votes ?? 0) - (b.votes ?? 0);
					} else {
						return (b.votes ?? 0) - (a.votes ?? 0);
					}
				});
			}

			return result;
		} else {
			const tableQuery: QueryInitializer<DataModel['feedbacks']> = ctx.db.query('feedbacks');

			let indexedQuery: Query<DataModel['feedbacks']> = tableQuery;
			if (args.sentiment && args.status) {
				indexedQuery = tableQuery.withIndex('by_published_sentiment_status_votes', (q) =>
					q.eq('published', true).eq('sentiment', args.sentiment).eq('status', args.status)
				);
			} else if (args.sentiment) {
				indexedQuery = tableQuery.withIndex('by_published_sentiment_votes', (q) =>
					q.eq('published', true).eq('sentiment', args.sentiment)
				);
			} else if (args.status) {
				indexedQuery = tableQuery.withIndex('by_published_status_votes', (q) =>
					q.eq('published', true).eq('status', args.status)
				);
			}

			let orderQuery: OrderedQuery<DataModel['feedbacks']> = indexedQuery;
			if (args.sort === 'asc') {
				orderQuery = indexedQuery.order('asc');
			} else {
				orderQuery = indexedQuery.order('desc');
			}

			return await orderQuery.paginate(args.paginationOpts);
		}
	}
});
