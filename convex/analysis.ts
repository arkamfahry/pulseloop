import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const moderatePrompt = `
You are a safety moderator for a real-time feedback pipeline. Input: a single string named "post" (placeholder: {CONTENT}). Follow these rules EXACTLY and return exactly one JSON object (no extra text):

1) PREPROCESSING FOR SAFETY
   - Replace any URLs, emails, phone numbers, and exact addresses with the token "<PII>".
   - Keep the original un-redacted post internally for analysis of whether it contains PII; but the output should include only the redacted text.
   - Remove/ignore explicit code blocks or quoted logs for the purpose of PII redaction (they must still be scanned for abusive/PII content).

2) APPLY SAFETY RULES (mark "rejected" if **any** of the following are present):
   A. Non-constructive rant/low-effort vent or empty/only-PII (e.g., "Ughhh this app sucks!!" with no actionable detail).
   B. Hate, targeted harassment, or demeaning content toward protected classes or individuals.
   C. Profanity/obscene sexual language used abusively (not constructive).
   D. Threats of violence or calls for harm.
   E. Coded hostile language / dog whistles / stereotypes implying hostility.
   F. Personal Identifiable Information (emails, phone numbers, home addresses, national IDs, or full names intended to identify a private person) — treat as rejected.
   G. Sarcasm/passive-aggressive remarks that demean a person or group.
   H. Ambiguously mocking or condescending content reasonably interpretable as harmful.

   If none of the above apply, mark "approved".

3) OUTPUT FORMAT
   - Return exactly one JSON object with only these two keys:
     { "safety": "<approved|rejected>", "redactedContent": "<the post with PII replaced by <PII> and code blocks removed/ignored for keyword purposes>" }
   - "redactedContent" must preserve the text structure but with PII replaced by "<PII>" and any removed code blocks replaced by the token "<CODE_BLOCK>".
   - Do not include any other keys, commentary, or explanation.

Example output:
{ "safety": "rejected", "redactedContent": "Contact me at <PII> — I can help." }
`;

export const moderateFeedback = internalAction({
  args: {
    feedbackId: v.id("feedbacks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = moderatePrompt.replace("{CONTENT}", args.content);
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            safety: {
              type: "STRING",
              enum: ["approved", "rejected"],
            },
            redactedContent: {
              type: "STRING",
            },
          },
          required: ["safety", "redactedContent"],
          propertyOrdering: ["safety", "redactedContent"],
        },
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    if (analysisResponse.text) {
      interface analysisResult {
        safety: "approved" | "rejected";
        redactedContent: string;
      }

      const result: analysisResult = JSON.parse(analysisResponse.text);

      await ctx.runMutation(internal.feedback.moderateFeedback, {
        feedbackId: args.feedbackId,
        safety: result.safety,
        redactedContent: result.redactedContent,
      });
    } else {
      console.error("Moderation failed");
    }
  },
});

const analysisPrompt = `
You are an analytical extractor that produces the final JSON for the feedback engine. You will be provided these inputs: 
  - "original_content": the original unmodified post (placeholder: {CONTENT}).
  - "moderation": the JSON result produced by the Moderation prompt (placeholder: {MODERATION_RESULT}), which contains:
      { "safety": "<approved|rejected>", "redactedContent": "<redacted text>" }

TASK: Using the moderation result and the rules below, return exactly one JSON object (no extra text) with only these keys:
  1. "keywords" — array of 1 to 3 strings (or [] if moderation.safety == "rejected").
  2. "sentiment" — one of "positive", "neutral", or "negative".
  3. "safety" — copy the "safety" value from the moderation input (i.e., "approved" or "rejected").

PROCESSING & RULES (follow exactly):

A) PREPROCESSING
   - Work from the "redactedContent" for keyword extraction. Use "original_content" only to confirm PII/safety if needed.
   - Remove or ignore explicit code blocks and markup for keyword extraction (they were replaced by "<CODE_BLOCK>" by moderation).
   - Treat "<PII>" tokens as PII — they must NOT appear in keywords.

B) KEYWORD RULES (exact pipeline)
   1. Tokenization & normalization:
      - Lowercase everything.
      - Strip all punctuation except internal apostrophes inside words.
      - Collapse multiple whitespace into single space.
      - Trim leading/trailing whitespace.
   2. Remove stop/generic words BEFORE selecting keywords. The following words are forbidden as keywords:
      good, bad, nice, great, love, use, because, from, thing, stuff, help, thanks, thank, issue, problem, app, product, feature, user
   3. Stemming:
      - Apply a Porter-style stemmer to tokens.
      - For meaningful multi-word concepts prefer a 2-word phrase (max) if it adds value (stem each token and join with single space).
   4. Selection:
      - Choose 1-3 high-value keywords/phrases that capture actionable topics, bugs, or product areas.
      - Order by importance (most important first).
      - If moderation.safety == "rejected", set "keywords": [] (empty array) regardless of findings.
      - If no high-value keywords exist but moderation.safety == "approved", return the single best stemmed keyword.

   5. Keyword format constraints:
      - Lowercase, punctuation removed, stemmed, trimmed, single spaces, max two words per keyword.

C) SENTIMENT RULES
   - Determine overall sentiment from content, emojis, punctuation, and tone.
   - Sarcasm/irony that implies criticism => "negative".
   - If mixed, pick predominant; if tie and one is negative/mocking, prefer "negative".
   - Short posts (<=5 tokens): use emojis/punctuation as tie-breakers; ambiguous => "neutral".
   - Emoji mapping: 👍🙂 => positive, 😡👎 => negative, 😐 => neutral.
   - Output must be exactly one of: "positive", "neutral", "negative".

D) FINAL OUTPUT
   - Return exactly one JSON object with only these keys: "keywords", "sentiment", "safety".
   - If moderation.safety == "rejected", ensure "keywords": [].
   - Ensure all keywords comply with the format rules above.
   - Do not include any other text or metadata.

Example (when moderation indicates approved):
{ "keywords": ["crash", "save"], "sentiment": "negative", "safety": "approved" }

Example (when moderation indicates rejected):
{ "keywords": [], "sentiment": "negative", "safety": "rejected" }
`;

export const analyzeFeedback = internalAction({
  args: {
    feedbackId: v.id("feedbacks"),
    originalContent: v.string(),
    moderationResult: v.object({
      safety: v.union(v.literal("approved"), v.literal("rejected")),
      redactedContent: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const prompt = analysisPrompt
      .replace("{CONTENT}", args.originalContent)
      .replace("{MODERATION_RESULT}", JSON.stringify(args.moderationResult));
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            keywords: {
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
            safety: {
              type: "STRING",
              enum: ["approved", "rejected"],
            },
          },
          required: ["keywords", "sentiment", "safety"],
          propertyOrdering: ["keywords", "sentiment", "safety"],
        },
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    if (analysisResponse.text) {
      interface analysisResult {
        keywords: string[];
        sentiment: "positive" | "neutral" | "negative";
        safety: "approved" | "rejected";
      }

      const result: analysisResult = JSON.parse(analysisResponse.text);

      await ctx.runMutation(internal.feedback.analyzeFeedback, {
        feedbackId: args.feedbackId,
        sentiment: result.sentiment,
        safety: result.safety,
        keywords: result.keywords,
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
    const embeddingResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: args.content,
    });

    if (
      embeddingResponse.embeddings &&
      embeddingResponse.embeddings.length > 0
    ) {
      const embeddingValues = embeddingResponse.embeddings[0].values;
      if (embeddingValues) {
        await ctx.runMutation(internal.feedback.embedFeedback, {
          feedbackId: args.feedbackId,
          embedding: embeddingValues,
        });
      } else {
        console.error("No embedding values found");
      }
    } else {
      console.error("Embedding failed");
    }
  },
});
