import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';
import { OrderedQuery, Query, QueryInitializer } from 'convex/server';
import { DataModel, Doc, Id } from './_generated/dataModel';

export const addKeywords = internalMutation({
	args: {
		keywords: v.array(v.string()),
		feedbackId: v.id('feedbacks')
	},
	handler: async (ctx, args) => {
		for (const keyword of args.keywords) {
			const existing = await ctx.db
				.query('keywords')
				.withIndex('by_keyword', (q) => q.eq('keyword', keyword))
				.unique();

			if (!existing) {
				const _id = await ctx.db.insert('keywords', {
					keyword: keyword
				});

				await ctx.db.insert('feedbackKeywords', {
					feedbackId: args.feedbackId,
					keywordId: _id
				});
			} else {
				await ctx.db.insert('feedbackKeywords', {
					feedbackId: args.feedbackId,
					keywordId: existing._id
				});
			}
		}
	}
});

export const removeKeywords = internalMutation({
	args: {
		keywords: v.array(v.string()),
		feedbackId: v.id('feedbacks')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		for (const keyword of args.keywords) {
			const existing = await ctx.db
				.query('keywords')
				.withIndex('by_keyword', (q) => q.eq('keyword', keyword))
				.unique();

			if (!existing) {
				continue;
			}

			const feedbackKeyword = await ctx.db
				.query('feedbackKeywords')
				.withIndex('by_feedbackId_keywordId', (q) =>
					q.eq('feedbackId', args.feedbackId).eq('keywordId', existing._id)
				)
				.unique();

			if (feedbackKeyword) {
				await ctx.db.delete(feedbackKeyword._id);
			}
		}
	}
});

export const getTopicCloud = query({
	args: {
		content: v.optional(v.string()),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		status: v.optional(v.union(v.literal('open'), v.literal('noted'))),
		topics: v.optional(v.array(v.string())),
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

		type Keyword = {
			id: Id<'keywords'>;
			name: string;
			count: number;
			negative: number;
			neutral: number;
			positive: number;
		};

		const keywordMap: Record<string, Keyword> = {};
		const allKeywords = await ctx.db.query('keywords').collect();
		const keywordLookup = new Map(allKeywords.map((t) => [t.keyword, t]));

		for (const feedback of feedbacks) {
			const feedbackKeywords: string[] = feedback.keywords ?? [];
			const sentiment = feedback.sentiment as 'positive' | 'negative' | 'neutral' | undefined;

			for (const keyword of feedbackKeywords) {
				const keywordDoc = keywordLookup.get(keyword);
				if (keywordDoc) {
					if (!keywordMap[keyword]) {
						keywordMap[keyword] = {
							id: keywordDoc._id,
							name: keywordDoc.keyword,
							count: 0,
							positive: 0,
							negative: 0,
							neutral: 0
						};
					}
					keywordMap[keyword].count += 1;
					if (sentiment === 'positive') keywordMap[keyword].positive += 1;
					else if (sentiment === 'negative') keywordMap[keyword].negative += 1;
					else if (sentiment === 'neutral') keywordMap[keyword].neutral += 1;
				}
			}
		}

		return keywordMap;
	}
});
