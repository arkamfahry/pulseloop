import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { betterAuthComponent } from './auth';
import { workflow } from '.';
import { OrderedQuery, Query, QueryInitializer } from 'convex/server';
import { DataModel, Doc, Id } from './_generated/dataModel';

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
			votes: 0,
			published: false,
			createdAt: Date.now()
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
				content: feedback.content,
				moderate: true
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
		keywords: v.optional(v.array(v.string()))
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.feedbackId, {
			sentiment: args.sentiment,
			keywords: args.keywords,
			published: true
		});

		if (args.keywords && args.keywords.length > 0 && args.sentiment) {
			await ctx.runMutation(internal.keyword.addKeywords, {
				keywords: args.keywords,
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
			keywords: feedback.keywords
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
		if (feedback.keywords && feedback.keywords.length > 0 && feedback.sentiment) {
			await ctx.runMutation(internal.keyword.removeKeywords, {
				keywords: feedback.keywords,
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
	args: {},
	handler: async (ctx, args) => {
		const feedbacks = await ctx.db
			.query('feedbacks')
			.withIndex('by_published_votes', (q) => q.eq('published', true))
			.order('desc')
			.collect();

		const feedbacksWithUsers = await Promise.all(
			feedbacks.map(async (feedback) => {
				const user = await ctx.db.get(feedback.userId);
				return { ...feedback, user };
			})
		);

		return {
			...feedbacks,
			page: feedbacksWithUsers
		};
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
	args: {},
	handler: async (ctx, args) => {
		const feedbacks = await ctx.db
			.query('feedbacks')
			.withIndex('by_published_votes', (q) => q.eq('published', false))
			.order('desc')
			.collect();

		const feedbacksWithUsers = await Promise.all(
			feedbacks.map(async (feedback) => {
				const user = await ctx.db.get(feedback.userId);
				return { ...feedback, user };
			})
		);

		return {
			...feedbacks,
			page: feedbacksWithUsers
		};
	}
});

export const searchFeedback = query({
	args: {
		content: v.optional(v.string()),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		status: v.optional(v.union(v.literal('open'), v.literal('noted'))),
		from: v.optional(v.number()),
		to: v.optional(v.number()),
		votes: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	handler: async (ctx, args) => {
		const tableQuery: QueryInitializer<DataModel['feedbacks']> = ctx.db.query('feedbacks');
		let indexedQuery: Query<DataModel['feedbacks']> = tableQuery;
		let orderedQuery: OrderedQuery<DataModel['feedbacks']> = indexedQuery;
		let feedbacks: Array<Doc<'feedbacks'>> = [];

		if (args.content) {
			orderedQuery = tableQuery.withSearchIndex('by_content', (q) => {
				let expr = q.search('content', args.content!).eq('published', true);

				if (args.sentiment) {
					expr = expr.eq('sentiment', args.sentiment);
				}

				if (args.status) {
					expr = expr.eq('status', args.status);
				}

				return expr;
			});

			if (args.from && args.to) {
				orderedQuery = orderedQuery.filter((q) =>
					q.and(q.gte(q.field('createdAt'), args.from!), q.lte(q.field('createdAt'), args.to!))
				);
			}

			feedbacks = await orderedQuery.collect();

			if (args.votes === 'asc') {
				feedbacks = feedbacks.sort((a, b) => a.votes - b.votes);
			} else {
				feedbacks = feedbacks.sort((a, b) => b.votes - a.votes);
			}
		} else {
			if (args.sentiment && args.status) {
				indexedQuery = tableQuery.withIndex(
					'by_published_sentiment_status_createdAt_votes',
					(q) => {
						const expr = q
							.eq('published', true)
							.eq('sentiment', args.sentiment!)
							.eq('status', args.status!);

						if (args.from && args.to) {
							return expr.gte('createdAt', args.from!).lte('createdAt', args.to!);
						}

						return expr;
					}
				);
			} else if (args.sentiment) {
				indexedQuery = tableQuery.withIndex('by_published_sentiment_createdAt_votes', (q) => {
					const expr = q.eq('published', true).eq('sentiment', args.sentiment!);

					if (args.from && args.to) {
						return expr.gte('createdAt', args.from!).lte('createdAt', args.to!);
					}

					return expr;
				});
			} else if (args.status) {
				indexedQuery = tableQuery.withIndex('by_published_status_createdAt_votes', (q) => {
					const expr = q.eq('published', true).eq('status', args.status!);

					if (args.from && args.to) {
						return expr.gte('createdAt', args.from!).lte('createdAt', args.to!);
					}

					return expr;
				});
			} else {
				indexedQuery = tableQuery.withIndex('by_published_votes', (q) => q.eq('published', true));
			}

			if (args.votes === 'asc') {
				orderedQuery = indexedQuery.order('asc');
			} else {
				orderedQuery = indexedQuery.order('desc');
			}

			feedbacks = await orderedQuery.collect();
		}

		const feedbacksWithUsers = await Promise.all(
			feedbacks.map(async (feedback) => {
				const user = await ctx.db.get(feedback.userId);
				return { ...feedback, user };
			})
		);

		return feedbacksWithUsers;
	}
});
