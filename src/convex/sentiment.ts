import { query } from './_generated/server';

export type SentimentCounts = {
	values: {
		sentiment: string;
		count: number;
	}[];
};

export const getSentimentsCounts = query({
	handler: async (ctx): Promise<SentimentCounts> => {
		let positive = 0;
		let negative = 0;
		let neutral = 0;

		for await (const feedback of ctx.db
			.query('feedbacks')
			.withIndex('by_status', (q) => q.eq('status', 'open'))) {
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

export type OverallSentiment = {
	sentiment: 'positive' | 'negative' | 'neutral';
	percentage: number;
};

export const getOverallSentiment = query({
	handler: async (ctx): Promise<OverallSentiment> => {
		let positive = 0;
		let negative = 0;
		let neutral = 0;
		let total = 0;

		for await (const feedback of ctx.db
			.query('feedbacks')
			.withIndex('by_status', (q) => q.eq('status', 'open'))) {
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
				percentage = (positive / total) * 100;
			} else if (negative >= positive && negative >= neutral) {
				sentiment = 'negative';
				percentage = (negative / total) * 100;
			} else {
				sentiment = 'neutral';
				percentage = (neutral / total) * 100;
			}
		}

		return { sentiment, percentage };
	}
});
