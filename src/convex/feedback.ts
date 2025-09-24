import { OrderedQuery, Query, QueryInitializer } from 'convex/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { DataModel, Doc, Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';

import { workflow } from '.';
import { betterAuthComponent } from './auth';

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

export const approveFeedback = mutation({
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

		await ctx.db.patch(feedback._id, {
			approval: 'approved'
		});

		await workflow.start(
			ctx,
			internal.analysis.feedbackAnalysisWorkflow,
			{
				feedbackId: feedback._id,
				content: feedback.content,
				moderate: false
			},
			{
				onComplete: internal.workflow.cleanupWorkflow,
				context: null
			}
		);
	}
});

export const toggleFeedbackNoted = mutation({
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

		if (feedback.status === 'open') {
			await ctx.db.patch(feedback._id, {
				status: 'noted'
			});
		} else {
			await ctx.db.patch(feedback._id, {
				status: 'open'
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

		if (feedback.keywords && feedback.keywords.length > 0) {
			await ctx.runMutation(internal.keyword.removeKeywords, {
				keywords: feedback.keywords,
				feedbackId: args.feedbackId
			});
		}

		if (feedback.embeddingId) {
			await ctx.db.delete(feedback.embeddingId);
		}

		await ctx.db.delete(feedback._id);
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
		if (!args.sentiment || !args.keywords || args.keywords.length === 0) {
			throw new Error('sentiment and non-empty keywords are required to publish feedback');
		}

		await ctx.db.patch(args.feedbackId, {
			sentiment: args.sentiment,
			keywords: args.keywords,
			published: true
		});

		await ctx.runMutation(internal.keyword.addKeywords, {
			keywords: args.keywords,
			feedbackId: args.feedbackId
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

export const getFeedbackById = query({
	args: { feedbackId: v.id('feedbacks') },
	handler: async (ctx, args) => {
		const feedback = await ctx.db.get(args.feedbackId);
		return feedback;
	}
});

export const listUnpublishedFeedback = query({
	args: {
		content: v.optional(v.string()),
		from: v.optional(v.number()),
		to: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const tableQuery: QueryInitializer<DataModel['feedbacks']> = ctx.db.query('feedbacks');
		let indexedQuery: Query<DataModel['feedbacks']> = tableQuery;
		let orderedQuery: OrderedQuery<DataModel['feedbacks']> = indexedQuery;
		let feedbacks: Array<Doc<'feedbacks'>> = [];

		if (args.content) {
			orderedQuery = tableQuery.withSearchIndex('by_content', (q) =>
				q.search('content', args.content!).eq('published', false)
			);
		} else {
			indexedQuery = tableQuery.withIndex('by_published_status', (q) =>
				q.eq('published', false).eq('status', 'open')
			);

			orderedQuery = indexedQuery.order('desc');
		}

		if (args.from && args.to) {
			orderedQuery = orderedQuery.filter((q) =>
				q.and(
					q.gte(q.field('_creationTime'), args.from!),
					q.lte(q.field('_creationTime'), args.to!)
				)
			);
		}

		feedbacks = await orderedQuery.collect();

		const feedbacksWithUsers = await Promise.all(
			feedbacks.map(async (feedback) => {
				const user = await ctx.db.get(feedback.userId);
				return { ...feedback, user };
			})
		);

		return feedbacksWithUsers;
	}
});

export const listPublishedFeedback = query({
	args: {
		content: v.optional(v.string()),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		status: v.optional(v.union(v.literal('open'), v.literal('noted'))),
		votes: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
		myFeedback: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		const tableQuery: QueryInitializer<DataModel['feedbacks']> = ctx.db.query('feedbacks');
		let indexedQuery: Query<DataModel['feedbacks']> = tableQuery;
		let orderedQuery: OrderedQuery<DataModel['feedbacks']> = indexedQuery;
		let feedbacks: Array<Doc<'feedbacks'>> = [];

		if (args.myFeedback) {
			const userId = await betterAuthComponent.getAuthUserId(ctx);
			if (!userId) {
				throw new Error('User not authenticated');
			}

			indexedQuery = tableQuery.withIndex('by_userId_published', (q) =>
				q.eq('userId', userId as Id<'users'>).eq('published', true)
			);

			orderedQuery = indexedQuery.order('desc');

			feedbacks = await orderedQuery.collect();

			if (args.sentiment) {
				feedbacks = feedbacks.filter((fb) => fb.sentiment === args.sentiment);
			}

			if (args.status) {
				feedbacks = feedbacks.filter((fb) => fb.status === args.status);
			}

			if (args.content) {
				const lc = args.content.toLowerCase();
				feedbacks = feedbacks.filter((fb) => fb.content?.toLowerCase().includes(lc));
			}

			if (args.votes === 'asc') {
				feedbacks = feedbacks.sort((a, b) => a.votes - b.votes);
			} else {
				feedbacks = feedbacks.sort((a, b) => b.votes - a.votes);
			}
		} else {
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

				feedbacks = await orderedQuery.collect();

				if (args.votes === 'asc') {
					feedbacks = feedbacks.sort((a, b) => a.votes - b.votes);
				} else {
					feedbacks = feedbacks.sort((a, b) => b.votes - a.votes);
				}
			} else {
				if (args.sentiment && args.status) {
					indexedQuery = tableQuery.withIndex('by_published_sentiment_status', (q) =>
						q.eq('published', true).eq('sentiment', args.sentiment!).eq('status', args.status!)
					);
				} else if (args.sentiment) {
					indexedQuery = tableQuery.withIndex('by_published_sentiment', (q) =>
						q.eq('published', true).eq('sentiment', args.sentiment!)
					);
				} else if (args.status) {
					indexedQuery = tableQuery.withIndex('by_published_status', (q) =>
						q.eq('published', true).eq('status', args.status!)
					);
				} else {
					indexedQuery = tableQuery.withIndex('by_published_sentiment', (q) =>
						q.eq('published', true)
					);
				}

				feedbacks = await indexedQuery.collect();

				if (args.votes === 'asc') {
					feedbacks = feedbacks.sort((a, b) => a.votes - b.votes);
				} else {
					feedbacks = feedbacks.sort((a, b) => b.votes - a.votes);
				}
			}
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

export const listPublishedFeedbackByKeywordId = query({
	args: {
		keywordId: v.id('keywords'),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		status: v.optional(v.union(v.literal('open'), v.literal('noted'))),
		from: v.optional(v.number()),
		to: v.optional(v.number()),
		votes: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	handler: async (ctx, args) => {
		const feedbackKeywords = await ctx.db
			.query('feedbackKeywords')
			.withIndex('by_keywordId', (q) => q.eq('keywordId', args.keywordId))
			.collect();

		let feedbacks = await Promise.all(
			feedbackKeywords.map(async (feedbackKeyword) => {
				const feedback = await ctx.db.get(feedbackKeyword.feedbackId);
				return feedback;
			})
		);

		if (args.sentiment) {
			feedbacks = feedbacks.filter((fb) => fb?.sentiment === args.sentiment);
		}

		if (args.status) {
			feedbacks = feedbacks.filter((fb) => fb?.status === args.status);
		}

		if (args.from && args.to) {
			feedbacks = feedbacks.filter(
				(fb) => fb && fb._creationTime >= args.from! && fb._creationTime <= args.to!
			);
		}

		if (args.votes === 'asc') {
			feedbacks = feedbacks.sort((a, b) => (a && b ? a.votes - b.votes : 0));
		} else {
			feedbacks = feedbacks.sort((a, b) => (a && b ? b.votes - a.votes : 0));
		}

		const feedbacksWithUsers = await Promise.all(
			feedbacks.map(async (feedback) => {
				if (!feedback) {
					return;
				}
				const user = await ctx.db.get(feedback.userId);
				return { ...feedback, user };
			})
		);

		return feedbacksWithUsers;
	}
});

export const searchPublishedFeedback = query({
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
					q.and(
						q.gte(q.field('_creationTime'), args.from!),
						q.lte(q.field('_creationTime'), args.to!)
					)
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
				indexedQuery = tableQuery.withIndex('by_published_sentiment_status', (q) =>
					q.eq('published', true).eq('sentiment', args.sentiment!).eq('status', args.status!)
				);
			} else if (args.sentiment) {
				indexedQuery = tableQuery.withIndex('by_published_sentiment', (q) =>
					q.eq('published', true).eq('sentiment', args.sentiment!)
				);
			} else if (args.status) {
				indexedQuery = tableQuery.withIndex('by_published_status', (q) =>
					q.eq('published', true).eq('status', args.status!)
				);
			} else {
				indexedQuery = tableQuery.withIndex('by_published_sentiment', (q) =>
					q.eq('published', true)
				);
			}

			if (args.votes === 'asc') {
				orderedQuery = indexedQuery.order('asc');
			} else {
				orderedQuery = indexedQuery.order('desc');
			}

			if (args.from && args.to) {
				indexedQuery = indexedQuery.filter((q) =>
					q.and(
						q.gte(q.field('_creationTime'), args.from!),
						q.lte(q.field('_creationTime'), args.to!)
					)
				);
			}

			feedbacks = await orderedQuery.collect();

			if (args.votes === 'asc') {
				feedbacks = feedbacks.sort((a, b) => a.votes - b.votes);
			} else {
				feedbacks = feedbacks.sort((a, b) => b.votes - a.votes);
			}
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

export const getTopFeedback = query({
	handler: async (ctx) => {
		const feedbacks = await ctx.db
			.query('feedbacks')
			.withIndex('by_published_sentiment', (q) => q.eq('published', true))
			.order('desc')
			.collect();

		const feedbacksWithUsers = await Promise.all(
			feedbacks.map(async (feedback) => {
				const user = await ctx.db.get(feedback.userId);
				return { ...feedback, user };
			})
		);

		return feedbacksWithUsers;
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

export const getTotalFeedbackCount = query({
	handler: async (ctx) => {
		const feedbacks = await ctx.db.query('feedbacks').collect();
		return feedbacks.length;
	}
});

export const getOpenFeedbackCount = query({
	handler: async (ctx) => {
		const feedbacks = await ctx.db
			.query('feedbacks')
			.withIndex('by_published_status', (q) => q.eq('published', true).eq('status', 'open'))
			.collect();

		return feedbacks.length;
	}
});
