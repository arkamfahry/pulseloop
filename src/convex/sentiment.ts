import { query } from './_generated/server';

export const getSentimentsCounts = query({
	handler: async (ctx) => {
		let positive = 0;
		let negative = 0;
		let neutral = 0;

		for await (const feedback of ctx.db
			.query('feedbacks')
			.withIndex('by_published_sentiment_status', (q) => q.eq('published', true))) {
			if (feedback.sentiment === 'positive') {
				positive++;
			} else if (feedback.sentiment === 'negative') {
				negative++;
			} else if (feedback.sentiment === 'neutral') {
				neutral++;
			}
		}

		return {
			values: [
				{ sentiment: 'positive', count: positive },
				{ sentiment: 'negative', count: negative },
				{ sentiment: 'neutral', count: neutral }
			]
		};
	}
});

export const getOverallSentiment = query({
	handler: async (ctx) => {
		let positive = 0;
		let negative = 0;
		let neutral = 0;
		let total = 0;

		for await (const feedback of ctx.db
			.query('feedbacks')
			.withIndex('by_published_sentiment_status', (q) => q.eq('published', true))) {
			if (feedback.sentiment === 'positive') {
				positive++;
			} else if (feedback.sentiment === 'negative') {
				negative++;
			} else if (feedback.sentiment === 'neutral') {
				neutral++;
			}
			total++;
		}

		let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
		let percentage = 0;

		if (total > 0) {
			if (positive >= negative && positive >= neutral) {
				sentiment = 'positive';
				percentage = Math.round((positive / total) * 100);
			} else if (negative >= positive && negative >= neutral) {
				sentiment = 'negative';
				percentage = Math.round((negative / total) * 100);
			} else {
				sentiment = 'neutral';
				percentage = Math.round((neutral / total) * 100);
			}
		}

		return { sentiment, percentage };
	}
});
