import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const promptTemplate = `
You are a highly analytical AI assistant for a real-time feedback engine.

<KEYWORD_RULES>
- **Normalize**: Convert all keywords to a single lowercase word or phrase. Remove all punctuation and extra whitespace. For example, "Bugs!", "bug", and "bugs" should all be treated as the same.
- **Stem**: Reduce words to their root form. For example, "running," "ran," and "runs" should all be simplified to "run." Similarly, "crashing," "crashed," and "crashes" should all be stemmed to "crash."
- **Avoid generic terms:** Do not use keywords that are too broad or have little semantic value on their own. This includes words like "good," "bad," "cool," "nice," "great," "love," "use," "because," "from," etc.
- **Exclude personal information (PII):** Do not extract any personal information such as email addresses, phone numbers, or physical addresses.
</KEYWORD_RULES>

<SENTIMENT_RULES>
- Consider explicit language, implied meaning, and emotional tone.
- Look for sarcasm, irony, or passive-aggressive remarks.
- Detect backhanded compliments (statements that appear positive but contain an underlying insult).
- Identify exaggerated praise used sarcastically to highlight a flaw.
- Note when a compliment is directly followed by a criticism in a way that diminishes the compliment.
- If the post appears superficially positive but the overall intention is critical or mocking, treat it as negative.
</SENTIMENT_RULES>

<SAFETY_RULES>
- Mark **'unsafe'** if the post contains:
  - Hate speech (targeting identity groups such as race, gender, religion, sexual orientation, nationality, disability, etc.)
  - Harassment, bullying, or intimidation (including subtle or indirect personal attacks)
  - Derogatory remarks, name-calling, or demeaning comparisons
  - Profanity or obscene language
  - Threats of violence or harm
  - Coded language, dog whistles, or stereotypes that convey hostility
  - Sarcasm, passive-aggressive, or backhanded remarks that demean or belittle a person or group
  - Any content that is ambiguous or could reasonably be interpreted as subtly mocking, condescending, or harmful
  - personal email addresses, phone numbers, or other private information that could lead to doxxing or harassment

- Mark **'safe'** only if:
  - The post contains no explicit or implicit harmful content
  - The tone is genuinely neutral or constructive, without hidden insults, mockery, or passive-aggressive language
</SAFETY_RULES>

Post: "{CONTENT}"

Return the output as a JSON object with three keys:
1. keywords: An array containing exactly three strings, representing the high-value keywords, normalized and stemmed.
2. sentiment: A string, which will be either "positive", "neutral", or "negative".
3. safety: A string, which will be either "safe" or "unsafe".
`;

export const AnalyzePost = internalAction({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = promptTemplate.replace("{CONTENT}", args.content);
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
              minItems: 3,
              maxItems: 3,
            },
            sentiment: {
              type: "STRING",
              enum: ["positive", "neutral", "negative"],
            },
            safety: {
              type: "STRING",
              enum: ["safe", "unsafe"],
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
        safety: "safe" | "unsafe";
      }

      const result: analysisResult = JSON.parse(analysisResponse.text);

      await ctx.runMutation(internal.post.publishPost, {
        postId: args.postId,
        sentiment: result.sentiment,
        safety: result.safety,
        keywords: result.keywords,
      });
    } else {
      console.error("Analysis failed");
    }
  },
});

export const EmbedPost = internalAction({
  args: {
    postId: v.id("posts"),
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
        await ctx.runMutation(internal.post.embedPost, {
          postId: args.postId,
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
