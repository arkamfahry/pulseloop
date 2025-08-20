import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { GoogleGenAI } from '@google/genai';
import { internal } from './_generated/api';
import { workflow } from '.';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const moderateFeedbackPrompt = `
You are an approval moderator for a real-time feedback pipeline. Input: a single string named "post" ({CONTENT}). Follow these rules EXACTLY and return exactly one JSON object (no extra text):

1) PREPROCESSING
- Scan the post for PII (emails, URLs, phone numbers, exact addresses, national IDs, or full names intended to identify a private person).
- Ignore explicit code blocks or quoted logs when scanning for PII, but still consider them for abusive or unsafe content.

2) APPROVAL RULES
- Mark "rejected" if **any** of the following are present:
  A. Non-constructive rant, low-effort vent, or empty/only-PII posts.
  B. Hate, targeted harassment, or demeaning content toward protected classes or individuals.
  C. Profanity/obscene sexual language used abusively.
  D. Threats of violence or calls for harm.
  E. Coded hostile language, dog whistles, or stereotypes implying hostility.
  F. Personal Identifiable Information (emails, phone numbers, addresses, national IDs, full names).
  G. Sarcasm or passive-aggressive remarks that demean a person or group.
  H. Ambiguous mocking or condescending content reasonably interpretable as harmful.
- If none of the above apply, mark "approved".

3) OUTPUT FORMAT
- Return exactly one JSON object with a single key:
  { "approval": "<approved|rejected>" }
- Do not include any other text, commentary, or explanation.

Example outputs:
{ "approval": "approved" }
{ "approval": "rejected" }
`;

export const moderateFeedback = internalAction({
	args: {
		feedbackId: v.id('feedbacks'),
		content: v.string()
	},
	handler: async (ctx, args) => {
		const prompt = moderateFeedbackPrompt.replace('{CONTENT}', args.content);
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				responseSchema: {
					type: 'OBJECT',
					properties: {
						approval: {
							type: 'STRING',
							enum: ['approved', 'rejected']
						}
					},
					required: ['approval'],
					propertyOrdering: ['approval']
				},
				thinkingConfig: {
					thinkingBudget: 0
				},
				temperature: 0.0
			}
		});

		if (response.text) {
			interface result {
				approval: 'approved' | 'rejected';
			}

			const result: result = JSON.parse(response.text);

			return result;
		} else {
			throw new Error('Moderation failed');
		}
	}
});

export const generateFeedbackEmbedding = internalAction({
	args: {
		feedbackId: v.id('feedbacks'),
		content: v.string()
	},
	handler: async (ctx, args) => {
		const response = await ai.models.embedContent({
			model: 'gemini-embedding-001',
			contents: args.content,
			config: {
				taskType: 'SEMANTIC_SIMILARITY',
				outputDimensionality: 1536
			}
		});

		if (response.embeddings && response.embeddings.length > 0) {
			const values = response.embeddings[0].values;
			if (values) {
				return values;
			} else {
				throw new Error('No embedding values found');
			}
		} else {
			throw new Error('Embedding failed');
		}
	}
});

export const findSimilarFeedbackAndReassignTopic = internalAction({
	args: {
		feedbackId: v.id('feedbacks'),
		embedding: v.array(v.number())
	},
	handler: async (ctx, args) => {
		const results = await ctx.vectorSearch('feedbackEmbeddings', 'by_embedding', {
			vector: args.embedding,
			limit: 1
		});

		if (results.length === 0) {
			return false;
		}

		const bestMatch = results[0];
		if (bestMatch._score > 0.9) {
			const feedback = await ctx.runQuery(internal.feedback.getFeedbackByEmbeddingId, {
				embeddingId: bestMatch._id
			});

			if (feedback) {
				await ctx.runMutation(internal.feedback.publishFeedback, {
					feedbackId: args.feedbackId,
					topics: feedback.topics,
					sentiment: feedback.sentiment
				});
			}
			return true;
		}

		return false;
	}
});

const extractFeedbackTopicsAndSentimentPrompt = `
You are an analytical extractor. Input:
- "content": the post text ({CONTENT})

Return exactly one JSON object:
{ "topics": [...], "sentiment": "..." }

PROCESS:

1) PREPROCESS
- Lowercase, remove punctuation (keep internal apostrophes), collapse spaces, trim.
- Ignore <CODE_BLOCK> and <PII>.

2) CONTEXT-AWARE TOPIC EXTRACTION
- Identify 1-3 main topics (max 2 words each), ordered by importance.
- Prioritize meaningful phrases: 
   - Adjective + noun (e.g., "slow wifi")
   - Noun + noun (e.g., "library wifi")
   - Include modifiers like adjectives or context words that clarify the topic.
- Exclude generic/stop words: good, bad, nice, great, love, use, because, from, thing, stuff, help, thanks, thank, issue, problem, app, product, feature, user.
- If no clear topics, return one best single word.
- If spelling errors, correct them (e.g., "wifi" instead of "wi-fi", "wifi" instead of "wfif").

3) SENTIMENT
- Classify as "positive", "neutral", or "negative".
- Use tone, punctuation, emojis (👍🙂=positive, 😡👎=negative, 😐=neutral).
- Sarcasm/irony → negative.
- Short posts (≤5 tokens) → emojis/punctuation as tie-breakers; ambiguous → neutral.

EXAMPLES:
{ "topics": ["slow wifi", "library"], "sentiment": "negative" }
{ "topics": ["crash"], "sentiment": "negative" }
`;

export const extractFeedbackTopicsAndSentiment = internalAction({
	args: {
		feedbackId: v.id('feedbacks'),
		content: v.string()
	},
	handler: async (ctx, args) => {
		const prompt = extractFeedbackTopicsAndSentimentPrompt.replace('{CONTENT}', args.content);
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				responseSchema: {
					type: 'OBJECT',
					properties: {
						topics: {
							type: 'ARRAY',
							items: {
								type: 'STRING'
							},
							minItems: 1,
							maxItems: 3
						},
						sentiment: {
							type: 'STRING',
							enum: ['positive', 'neutral', 'negative']
						}
					},
					required: ['topics', 'sentiment'],
					propertyOrdering: ['topics', 'sentiment']
				},
				thinkingConfig: {
					thinkingBudget: 0
				},
				temperature: 0.0
			}
		});

		if (response.text) {
			interface result {
				topics: string[];
				sentiment: 'positive' | 'neutral' | 'negative';
			}

			const result: result = JSON.parse(response.text);

			await ctx.runMutation(internal.feedback.publishFeedback, {
				feedbackId: args.feedbackId,
				topics: result.topics,
				sentiment: result.sentiment
			});
		} else {
			throw new Error('Analysis failed');
		}
	}
});

export const feedbackAnalysisWorkflow = workflow.define({
	args: {
		feedbackId: v.id('feedbacks'),
		content: v.string()
	},
	handler: async (step, args): Promise<void> => {
		const moderated = await step.runAction(internal.analysis.moderateFeedback, {
			feedbackId: args.feedbackId,
			content: args.content
		});

		await step.runMutation(internal.feedback.setFeedbackApproval, {
			feedbackId: args.feedbackId,
			approval: moderated.approval
		});

		if (moderated.approval === 'rejected') {
			return;
		}

		const embedding = await step.runAction(internal.analysis.generateFeedbackEmbedding, {
			feedbackId: args.feedbackId,
			content: args.content
		});

		const similarFeedback = await step.runAction(
			internal.analysis.findSimilarFeedbackAndReassignTopic,
			{
				feedbackId: args.feedbackId,
				embedding: embedding
			}
		);

		if (!similarFeedback) {
			await step.runAction(internal.analysis.extractFeedbackTopicsAndSentiment, {
				feedbackId: args.feedbackId,
				content: args.content
			});
		}

		await step.runMutation(internal.feedback.attachFeedbackEmbedding, {
			feedbackId: args.feedbackId,
			embedding: embedding
		});
	}
});
