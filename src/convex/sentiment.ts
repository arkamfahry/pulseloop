import { v } from 'convex/values';
import { query } from './_generated/server';
import { OrderedQuery, Query, QueryInitializer } from 'convex/server';
import { DataModel, Doc } from './_generated/dataModel';

export const getSentimentChart = query({
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

		const from =
			args.from ??
			(feedbacks.length > 0 ? Math.min(...feedbacks.map((f) => f.createdAt)) : Date.now());
		const to = args.to ?? Date.now();

		const { buckets, bucketFn, granularity, bucketRanges } = getTimeBuckets(from, to);

		const sentimentCounts: Record<'positive' | 'negative' | 'neutral', Record<string, number>> = {
			positive: {},
			negative: {},
			neutral: {}
		};
		for (const b of buckets) {
			sentimentCounts.positive[b] = 0;
			sentimentCounts.negative[b] = 0;
			sentimentCounts.neutral[b] = 0;
		}
		for (const fb of feedbacks) {
			if (!fb.sentiment) continue;
			const bucket = bucketFn(fb.createdAt);
			if (sentimentCounts[fb.sentiment] && bucket in sentimentCounts[fb.sentiment]) {
				sentimentCounts[fb.sentiment][bucket]++;
			}
		}

		return {
			granularity,
			points: buckets.map((b, i) => ({
				time: b,
				start: bucketRanges[i].start,
				end: bucketRanges[i].end,
				positive: sentimentCounts.positive[b],
				negative: sentimentCounts.negative[b],
				neutral: sentimentCounts.neutral[b]
			}))
		};
	}
});

function getTimeBuckets(
	from: number,
	to: number
): {
	buckets: string[];
	bucketFn: (ts: number) => string;
	granularity: 'month' | 'week' | 'day';
	bucketRanges: { start: number; end: number }[];
} {
	const MS_PER_DAY = 86400000;
	const days = Math.ceil((to - from) / MS_PER_DAY);

	let granularity: 'month' | 'week' | 'day';
	if (days > 180) {
		granularity = 'month';
	} else if (days > 30) {
		granularity = 'week';
	} else {
		granularity = 'day';
	}

	const buckets: string[] = [];
	const bucketRanges: { start: number; end: number }[] = [];
	let d = new Date(from);
	let end = new Date(to);

	if (granularity === 'month') {
		d = new Date(d.getFullYear(), d.getMonth(), 1);
		end = new Date(end.getFullYear(), end.getMonth(), 1);
		while (d <= end) {
			const start = d.getTime();
			const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
			const bucketLabel = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			buckets.push(bucketLabel);
			bucketRanges.push({ start, end: next.getTime() - 1 });
			d.setMonth(d.getMonth() + 1);
		}
		return {
			buckets,
			bucketFn: (ts: number) => {
				const date = new Date(ts);
				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			},
			granularity,
			bucketRanges
		};
	} else if (granularity === 'week') {
		d.setHours(0, 0, 0, 0);
		while (d <= end) {
			const start = d.getTime();
			const next = new Date(d.getTime());
			next.setDate(next.getDate() + 7);
			const year = d.getFullYear();
			const temp = new Date(d.getTime());
			temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));
			const week1 = new Date(temp.getFullYear(), 0, 1);
			const week = Math.ceil(((temp.getTime() - week1.getTime()) / 86400000 + 1) / 7);
			buckets.push(`${year}-W${String(week).padStart(2, '0')}`);
			bucketRanges.push({ start, end: next.getTime() - 1 });
			d.setDate(d.getDate() + 7);
		}
		return {
			buckets,
			bucketFn: (ts: number) => {
				const date = new Date(ts);
				const year = date.getFullYear();
				const temp = new Date(date.getTime());
				temp.setDate(temp.getDate() + 4 - (temp.getDay() || 7));
				const week1 = new Date(temp.getFullYear(), 0, 1);
				const week = Math.ceil(((temp.getTime() - week1.getTime()) / 86400000 + 1) / 7);
				return `${year}-W${String(week).padStart(2, '0')}`;
			},
			granularity,
			bucketRanges
		};
	} else {
		d.setHours(0, 0, 0, 0);
		end.setHours(0, 0, 0, 0);
		while (d <= end) {
			const start = d.getTime();
			const next = new Date(d.getTime());
			next.setDate(next.getDate() + 1);
			buckets.push(
				`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
			);
			bucketRanges.push({ start, end: next.getTime() - 1 });
			d.setDate(d.getDate() + 1);
		}
		return {
			buckets,
			bucketFn: (ts: number) => {
				const date = new Date(ts);
				return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
			},
			granularity,
			bucketRanges
		};
	}
}
