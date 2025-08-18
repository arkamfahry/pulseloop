import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const moderationPrompt = `
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
    feedbackId: v.id("feedbacks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = moderationPrompt.replace("{CONTENT}", args.content);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            approval: {
              type: "STRING",
              enum: ["approved", "rejected"],
            },
          },
          required: ["approval"],
          propertyOrdering: ["approval"],
        },
        thinkingConfig: {
          thinkingBudget: 0,
        },
        temperature: 0.0,
      },
    });

    if (response.text) {
      interface result {
        approval: "approved" | "rejected";
      }

      const result: result = JSON.parse(response.text);

      await ctx.runMutation(internal.feedback.moderateFeedback, {
        feedbackId: args.feedbackId,
        approval: result.approval,
      });
    } else {
      console.error("Moderation failed");
    }
  },
});

const analysisPrompt = `
You are an analytical extractor that categorizes content for a feedback engine. Input:
- "content": the post text ({CONTENT})

Return exactly one JSON object with keys:
{ "topics": [...], "sentiment": "..." }

PROCESS:

A) PREPROCESSING
- Use "content" for categorization.
- Ignore code blocks (<CODE_BLOCK>) and treat <PII> as PII (do not include in topics).
- Lowercase, remove punctuation except internal apostrophes, collapse spaces, trim whitespace.
- Correct consistent spelling errors if present.

B) TOPIC CATEGORIZATION
- Identify the main subject(s) or theme(s) of the content.
- Remove generic words and stopwords that do not convey a topic (e.g., good, bad, nice, great, love, use, because, from, thing, stuff, help, thanks, thank, issue, problem, app, product, feature, user).
- Combine adjacent words into meaningful topic phrases (maximum 2 words).
- Select 1-3 high-value topics, ordered by importance.
- If no clear topic exists, return a single best keyword representing the topic.
- Topics: lowercase, punctuation removed, trimmed, max 2 words.

C) SENTIMENT
- Determine "positive", "neutral", or "negative".
- Use tone, punctuation, emojis (👍🙂=positive, 😡👎=negative, 😐=neutral).
- Sarcasm/irony implies negative.
- Short posts (≤5 tokens): emojis/punctuation as tie-breakers; ambiguous → neutral.
- If mixed, pick predominant; ties with negative/mocking → negative.

D) FINAL OUTPUT
- Return exactly one JSON object with keys: topics, sentiment.
- No extra text or metadata.

EXAMPLES:
{ "topics": ["slow wifi", "library", "uni work"], "sentiment": "negative" }
{ "topics": ["crash"], "sentiment": "negative" }
`;

export const analyzeFeedback = internalAction({
  args: {
    feedbackId: v.id("feedbacks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = analysisPrompt.replace("{CONTENT}", args.content);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            topics: {
              type: "ARRAY",
              items: {
                type: "STRING",
              },
              minItems: 1,
              maxItems: 3,
            },
            sentiment: {
              type: "STRING",
              enum: ["positive", "neutral", "negative"],
            },
          },
          required: ["topics", "sentiment"],
          propertyOrdering: ["topics", "sentiment"],
        },
        thinkingConfig: {
          thinkingBudget: 0,
        },
        temperature: 0.0,
      },
    });

    if (response.text) {
      interface result {
        topics: string[];
        sentiment: "positive" | "neutral" | "negative";
      }

      const result: result = JSON.parse(response.text);

      await ctx.runMutation(internal.feedback.analyzeFeedback, {
        feedbackId: args.feedbackId,
        sentiment: result.sentiment,
        topics: result.topics,
      });
    } else {
      console.error("Analysis failed");
    }
  },
});

export const embedFeedback = internalAction({
  args: {
    feedbackId: v.id("feedbacks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: args.content,
    });

    if (response.embeddings && response.embeddings.length > 0) {
      const values = response.embeddings[0].values;
      if (values) {
        await ctx.runMutation(internal.feedback.embedFeedback, {
          feedbackId: args.feedbackId,
          embedding: values,
        });
      } else {
        console.error("No embedding values found");
      }
    } else {
      console.error("Embedding failed");
    }
  },
});
