import { GoogleGenAI } from '@google/genai';

import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { v } from 'convex/values';

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
					keywords: feedback.keywords,
					sentiment: feedback.sentiment
				});
			}
			return true;
		}

		return false;
	}
});

const extractFeedbackKeywordsAndSentimentPrompt = `
You are an analytical extractor. Input:
- "content": the post text ({CONTENT})

Return exactly one JSON object:
{ "keywords": [...], "sentiment": "..." }

PROCESS:

1) PREPROCESS
- Lowercase, remove punctuation (keep internal apostrophes), collapse spaces, trim.
- Ignore <CODE_BLOCK> and <PII>.

2) KEYWORD EXTRACTION
- Extract 1-3 meaningful keywords, ordered by importance.
- Include relevant modifiers that add context:
  - Adjective + noun pairs: "slow wifi", "broken printer"
  - Important standalone nouns: "library", "cafeteria", "exam"
  - Action words when relevant: "crashing", "freezing", "loading"
- Exclude generic/stop words: good, bad, nice, great, love, hate, use, using, because, from, thing, stuff, help, thanks, thank, issue, problem, very, really, quite, just, also, but, and, the, this, that, have, has, get, got, make, made, work, works, working.
- Fix common spelling errors: "wifi" (not "wi-fi"), "lab" (not "laab"), etc.
- Keep domain-specific terms: course names, building names, specific services.

3) SENTIMENT  
- Classify as "positive", "neutral", or "negative".
- Use tone, punctuation, emojis (👍🙂=positive, 😡👎=negative, 😐=neutral).
- Sarcasm/irony → negative.
- Short posts (≤5 tokens) → emojis/punctuation as tie-breakers; ambiguous → neutral.

EXAMPLES:
{ "keywords": ["slow wifi", "library", "disconnecting"], "sentiment": "negative" }
{ "keywords": ["crash", "lab computer"], "sentiment": "negative" }
{ "keywords": ["cafeteria food", "delicious"], "sentiment": "positive" }
`;

export const extractFeedbackKeywordsAndSentiment = internalAction({
	args: {
		feedbackId: v.id('feedbacks'),
		content: v.string()
	},
	handler: async (ctx, args) => {
		const prompt = extractFeedbackKeywordsAndSentimentPrompt.replace('{CONTENT}', args.content);
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				responseSchema: {
					type: 'OBJECT',
					properties: {
						keywords: {
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
					required: ['keywords', 'sentiment'],
					propertyOrdering: ['keywords', 'sentiment']
				},
				thinkingConfig: {
					thinkingBudget: 0
				},
				temperature: 0.0
			}
		});

		if (response.text) {
			interface result {
				keywords: string[];
				sentiment: 'positive' | 'neutral' | 'negative';
			}

			const result: result = JSON.parse(response.text);

			await ctx.runMutation(internal.feedback.publishFeedback, {
				feedbackId: args.feedbackId,
				keywords: result.keywords,
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
		content: v.string(),
		moderate: v.boolean()
	},
	handler: async (step, args): Promise<void> => {
		if (args.moderate) {
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
			await step.runAction(internal.analysis.extractFeedbackKeywordsAndSentiment, {
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
