import { v } from 'convex/values';
import { action } from './_generated/server';
import { GoogleGenAI } from '@google/genai';
import { internal } from './_generated/api';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const summarizeFeedbackPrompt = `
You are an AI assistant tasked with summarizing user feedback for a product team. Input: a JSON array of feedback objects named "feedback" ({CONTENT}). Each object contains "keyword", "sentiment", and "content". Follow these rules EXACTLY and return exactly one JSON object (no extra text).

1) ANALYSIS & SYNTHESIS
- Analyze the entire array of feedback objects to identify the most critical and frequent themes.
- Group similar feedback points together, even if their keywords or phrasing differ.
- Prioritize insights that are actionable or highlight significant user satisfaction or pain points.
- Note the overall sentiment trend (e.g., mostly positive, mixed with specific concerns, etc.).

2) SUMMARIZATION RULES
- Generate a summary that is **concise, neutral, and objective**.
- The summary must be a single paragraph, no more than 4-5 sentences.
- **Do not** use bullet points, lists, or markdown formatting in the summary text.
- Start the summary with a high-level overview of the general sentiment.
- Follow with 2-3 sentences detailing the key themes or recurring topics (e.g., "Many users praised the new UI, but several reported issues with login performance and a lack of customization options.").
- Conclude with a final sentence that captures any secondary but notable points.
- **Do not** invent new information or directly quote from the feedback content. Synthesize the ideas.

3) OUTPUT FORMAT
- Return exactly one JSON object with a single key:
  { "summary": "<string>" }
- The value of the "summary" key must be the generated paragraph.
- Do not include any other text, commentary, or explanation.

Example Input:
[
  { "keyword": "UI", "sentiment": "positive", "content": "The new interface is so clean and easy to use!" },
  { "keyword": "performance", "sentiment": "negative", "content": "The app has been really slow since the last update." },
  { "keyword": "login", "sentiment": "negative", "content": "I keep getting logged out and have to re-enter my password." },
  { "keyword": "design", "sentiment": "positive", "content": "I love the new look and feel, great job on the redesign." }
]

Example Output:
{ "summary": "Overall feedback is mixed. Users are highly positive about the new UI and design, praising its clean and modern look. However, significant concerns were raised regarding performance issues, with reports of slowness and recurring login problems." }
`;

export const summarizeFeedback = action({
	args: {
		feedbackIds: v.array(v.id('feedbacks'))
	},
	returns: {
		summary: v.string()
	},
	handler: async (ctx, args) => {
		const feedbacks = await ctx.runQuery(internal.feedback.listFeedbackByIds, {
			feedbackIds: args.feedbackIds
		});

		if (feedbacks.length === 0) {
			throw new Error('No feedbacks found for the provided IDs');
		}

		const feedbackContent = feedbacks
			.filter((f): f is NonNullable<typeof f> => f !== null)
			.map(({ keywords, sentiment, content }) => ({
				keywords,
				sentiment,
				content
			}));

		const prompt = summarizeFeedbackPrompt.replace('{CONTENT}', JSON.stringify(feedbackContent));
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				responseSchema: {
					type: 'OBJECT',
					properties: {
						summary: {
							type: 'STRING'
						}
					},
					required: ['summary'],
					propertyOrdering: ['summary']
				},
				thinkingConfig: {
					thinkingBudget: 0
				},
				temperature: 0.0
			}
		});

		if (response.text) {
			interface result {
				summary: string;
			}

			const result: result = JSON.parse(response.text);

			return result;
		} else {
			throw new Error('Summarization failed');
		}
	}
});
