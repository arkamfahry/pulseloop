import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const promptTemplate = `
Analyze the following post and identify three high-value keywords based on its context. Also, determine the overall sentiment of the post, classifying it as 'positive', 'neutral', or 'negative'. 

When determining sentiment:
- Consider explicit language, implied meaning, and emotional tone.
- Look for sarcasm, irony, or passive-aggressive remarks.
- Detect backhanded compliments (statements that appear positive but contain an underlying insult).
- Identify exaggerated praise used sarcastically to highlight a flaw.
- Note when a compliment is directly followed by a criticism in a way that diminishes the compliment.
- If the post appears superficially positive but the overall intention is critical or mocking, treat it as negative.

Safety classification rules for public feedback systems:
- Mark **'unsafe'** if the post contains:
  - Hate speech (targeting identity groups such as race, gender, religion, sexual orientation, nationality, disability, etc.)
  - Harassment, bullying, or intimidation (including subtle or indirect personal attacks)
  - Derogatory remarks, name-calling, or demeaning comparisons
  - Profanity or obscene language
  - Threats of violence or harm
  - Coded language, dog whistles, or stereotypes that convey hostility
  - Sarcasm, passive-aggressive, or backhanded remarks that demean or belittle a person or group
  - Any content that is ambiguous or could reasonably be interpreted as subtly mocking, condescending, or harmful

- Mark **'safe'** only if:
  - The post contains no explicit or implicit harmful content
  - The tone is genuinely neutral or constructive, without hidden insults, mockery, or passive-aggressive language

Extra refinements for disguised insults:
- If a compliment or positive phrase is framed in a way that highlights a negative trait (e.g., “perfect for someone with low expectations”), treat it as unsafe.
- If a positive-sounding description contrasts with a flaw (e.g., “relaxed pace” used to imply “too slow”), consider the underlying meaning as unsafe.
- Evaluate the **entire tone trajectory**, not just the last sentence.
- If the statement praises one group while implicitly criticizing another, mark it as unsafe.

Here are examples:

Example 1
Post: "The lectures have a very… relaxed pace, which might be perfect for someone with a lot of patience. However, a slightly faster delivery could help keep students awake."
Output:
{
  "keywords": ["lectures", "relaxed pace", "students"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 2
Post: "Your presentation style is unique — not everyone can make a 10-minute point stretch to 45 minutes."
Output:
{
  "keywords": ["presentation", "style", "minutes"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 3
Post: "This class is great if you enjoy reviewing the same topic over and over again until it loses all meaning."
Output:
{
  "keywords": ["class", "topic", "meaning"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 4
Post: "She's definitely passionate — you can tell by how loudly she talks over everyone else."
Output:
{
  "keywords": ["passionate", "talks", "everyone"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 5
Post: "I admire how you stick to your opinions, no matter how many facts prove you wrong."
Output:
{
  "keywords": ["opinions", "facts", "wrong"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 6
Post: "The Wi-Fi is amazing here — if you’re nostalgic for the days of dial-up."
Output:
{
  "keywords": ["wi-fi", "amazing", "dial-up"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 7
Post: "I guess it's impressive how consistently you ignore feedback."
Output:
{
  "keywords": ["ignore", "feedback", "consistently"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 8
Post: "The team meetings are very productive — for catching up on my personal reading."
Output:
{
  "keywords": ["team", "meetings", "productive"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 9
Post: "I appreciate how your emails always get straight to the point… eventually."
Output:
{
  "keywords": ["emails", "point", "eventually"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 10
Post: "He has a real talent for making simple tasks sound complicated."
Output:
{
  "keywords": ["talent", "tasks", "complicated"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 11
Post: "Your code is… interesting. It's a real adventure figuring out what it actually does."
Output:
{
  "keywords": ["code", "adventure", "figuring"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 12
Post: "I love how thorough your report is… it really made me question my own sanity reading it."
Output:
{
  "keywords": ["report", "thorough", "sanity"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 13
Post: "It’s impressive how much effort you put into making mistakes consistently."
Output:
{
  "keywords": ["effort", "mistakes", "consistently"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 14
Post: "Your optimism is refreshing — most people would have given up after such a minor setback."
Output:
{
  "keywords": ["optimism", "refreshing", "setback"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 15
Post: "The decorations are… bold. Definitely not everyone's taste."
Output:
{
  "keywords": ["decorations", "bold", "taste"],
  "sentiment": "neutral",
  "safety": "unsafe"
}

Example 16
Post: "I admire your confidence — some might call it reckless, but that's subjective."
Output:
{
  "keywords": ["confidence", "reckless", "subjective"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 17
Post: "The meeting was enlightening… mostly in showing what not to do."
Output:
{
  "keywords": ["meeting", "enlightening", "not to do"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 18
Post: "I like how you handle criticism — you ignore it with style."
Output:
{
  "keywords": ["criticism", "ignore", "style"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 19
Post: "This artwork is unique — I've never seen someone fail so creatively."
Output:
{
  "keywords": ["artwork", "unique", "creatively"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 20
Post: "You clearly put a lot of thought into this… even if the result is questionable."
Output:
{
  "keywords": ["thought", "result", "questionable"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 21
Post: "It's great how enthusiastic you are — enthusiasm sometimes makes up for accuracy."
Output:
{
  "keywords": ["enthusiastic", "accuracy", "great"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 22
Post: "I admire your dedication — it really tests the limits of patience."
Output:
{
  "keywords": ["dedication", "limits", "patience"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 23
Post: "The presentation was… memorable. I won't forget it, for better or worse."
Output:
{
  "keywords": ["presentation", "memorable", "forget"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 24
Post: "You have a special way of making simple things… unnecessarily complicated."
Output:
{
  "keywords": ["special", "simple", "complicated"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Example 25
Post: "I appreciate your thoroughness — it certainly makes every small mistake feel monumental."
Output:
{
  "keywords": ["thoroughness", "mistake", "monumental"],
  "sentiment": "negative",
  "safety": "unsafe"
}

Post: "{CONTENT}"

Return the output as a JSON object with three keys:
1. keywords: An array containing exactly three strings, representing the high-value keywords all in lower case.
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
        keyWords: result.keywords,
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
