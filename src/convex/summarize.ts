import { v } from 'convex/values';
import { action } from './_generated/server';
import { GoogleGenAI } from '@google/genai';
import { internal } from './_generated/api';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const summarizeFeedbackPrompt = `
You are an AI assistant tasked with generating a clean, simple, and consistent HTML summary of user feedback. Your input is a JSON array of feedback objects named "feedback" ({CONTENT}). Follow these rules EXACTLY and return exactly one JSON object.

1.  **Analysis & Synthesis:**
    *   Analyze the entire feedback array to identify the overall sentiment, key themes, actionable insights, and representative quotes.
    *   Synthesize the information concisely. Do not invent information or use overly complex language.

2.  **HTML Output Structure & Formatting Rules:**
    *   The entire summary must be a single, valid HTML string.
    *   Use a paragraph tag (\`<p>\`) for sections that contain a single line of text, like "Overall Sentiment" and "Actionable Insight".
    *   **To create a simple line break between sections, place a single break tag (\`<br>\`) after the closing tag of each section, except for the very last one.**
    *   Use a \`<strong>\` tag for the section title (e.g., "Overall Sentiment:").
    *   For the "Key Themes" section, first state the title in a \`<p>\` tag, followed immediately by the themes formatted as an unordered list (\`<ul>\` with \`<li>\` items).
    *   For the "Representative Quotes" section, present the quotes as a bulleted list (points). First, state the title in a \`<p>\` tag, followed immediately by an unordered list (\`<ul>\`) where each quote is an \`<li>\` item. Enclose each quote in quotation marks.

3.  **JSON Output Format:**
    *   Return exactly one JSON object with a single key: \`summary\`.
    *   The value of the \`summary\` key must be the complete HTML string.
    *   The final HTML string must be a single line of text with no formatting newlines (\`\\n\`) inside it.

Example Input:
[
  { "keyword": "food", "sentiment": "negative", "content": "The Cafeteria food is a bit stale and dry and its hardly palatable", "upvotes": 25 },
  { "keyword": "space", "sentiment": "negative", "content": "The cafeteria doesn’t have enough space to sit during interval time at 11.30", "upvotes": 15 }
]

Example Output:
{
  "summary": "<p><strong>Overall Sentiment:</strong> Negative</p><br><p><strong>Key Themes:</strong></p><ul><li><strong>Poor Food Quality:</strong> Users report that the food served is stale, dry, and of low palatability, indicating a significant quality issue. This is the most upvoted concern.</li><li><strong>Insufficient Seating Capacity:</strong> There is a recurring problem with overcrowding and a lack of available seating, especially during peak hours.</li></ul><br><p><strong>Actionable Insight:</strong> The two primary issues are food quality and physical space. The most pressing concern, based on user upvotes, is the food quality, which should be addressed immediately.</p><br><p><strong>Representative Quotes:</strong></p><ul><li>\\"The Cafeteria food is a bit stale and dry and its hardly palatable\\"</li><li>\\"The cafeteria doesn’t have enough space to sit during interval time at 11.30\\"</li></ul>"
}
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
