import { query } from './_generated/server';

export const getOverallSentiments = query({
	args: {},
	handler: async (ctx, args) => {
		let positive = 0;
		let negative = 0;
		let neutral = 0;
		let total = 0;

		for await (const feedback of ctx.db.query('feedbacks')) {
			if (feedback.sentiment === 'positive') {
				positive++;
			} else if (feedback.sentiment === 'negative') {
				negative++;
			} else if (feedback.sentiment === 'neutral') {
				neutral++;
			}
			total++;
		}

		return { positive, negative, neutral, total };
	}
});
