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

		if (!feedback.keywords?.length || !feedback.sentiment) {
			return;
		}

		await ctx.runMutation(internal.keyword.removeKeywords, {
			keywords: feedback.keywords,
			feedbackId: args.feedbackId
		});
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
		content: v.optional(v.string())
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
			indexedQuery = tableQuery.withIndex('by_published_votes', (q) => q.eq('published', false));
			orderedQuery = indexedQuery.order('desc');
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
			indexedQuery = tableQuery.withIndex('by_userId_published_votes', (q) =>
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
					indexedQuery = tableQuery.withIndex(
						'by_published_sentiment_status_createdAt_votes',
						(q) => {
							const expr = q
								.eq('published', true)
								.eq('sentiment', args.sentiment!)
								.eq('status', args.status!);

							return expr;
						}
					);
				} else if (args.sentiment) {
					indexedQuery = tableQuery.withIndex('by_published_sentiment_createdAt_votes', (q) => {
						const expr = q.eq('published', true).eq('sentiment', args.sentiment!);

						return expr;
					});
				} else if (args.status) {
					indexedQuery = tableQuery.withIndex('by_published_status_createdAt_votes', (q) => {
						const expr = q.eq('published', true).eq('status', args.status!);

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
				(fb) => fb && fb.createdAt >= args.from! && fb.createdAt <= args.to!
			);
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
			.withIndex('by_status', (q) => q.eq('status', 'open'))
			.collect();

		return feedbacks.length;
	}
});
