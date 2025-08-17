import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { internal } from "./_generated/api";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const promptTemplate = `
You are a highly analytical AI assistant for a real-time feedback engine. Follow these rules *exactly*.

--- OUTPUT FORMAT (MANDATORY) ---
Return exactly one JSON object (no extra text, no prose). The JSON must contain only these three keys:
1. "keywords" — array of exactly 1 to 3 strings (unless safety rule forces rejection; see SAFETY_RULES). Each string must be normalized and stemmed as specified below.
2. "sentiment" — one of "positive", "neutral", or "negative".
3. "safety" — one of "safe" or "unsafe".

If the post is flagged as unsafe per SAFETY_RULES, "keywords" must be an empty array ("[]"). Do not include any additional keys or metadata.

--- PREPROCESSING ---
1. Language detection:
   - If the post is not in English, translate it to English for analysis (preserve original text for PII detection), then perform all downstream steps on the English translation.
2. Remove or ignore any explicit code blocks, markup (HTML/MD), or quoted system logs for keyword extraction. However, still analyze them for safety if they contain abusive or PII content.
3. Replace URLs, emails, phone numbers, and exact addresses with the token "<PII>" for safety checking and then treat as PII (see SAFETY_RULES).

--- KEYWORD RULES (exact processing pipeline) ---
A. Tokenization & normalization:
   1. Lowercase everything.
   2. Strip all punctuation except internal apostrophes inside words (e.g., "don't" -> "dont" after stemming rules below).
   3. Collapse multiple whitespace into single space.
   4. Remove leading/trailing whitespace.
B. Remove stop/generic words BEFORE selecting keywords:
   - Do not use overly generic tokens such as: "good", "bad", "nice", "great", "love", "use", "because", "from", "app", "feature", "thing", "stuff", "issue", "problem" (these are forbidden as keywords).
C. Stemming:
   - Apply a standard Porter-style stemmer (or equivalent) to reduce words to their root form (e.g., running/ran/runs -> run; crashing/crashed/crashes -> crash).
   - For multi-word concepts that are meaningful together (e.g., "battery life", "login error"), prefer a short phrase (2 words) as a single keyword if it conveys more value than single-word stems. Normalize phrase by stemming each token and joining with a single space, e.g., "batteri life" -> "batteri life" (after stemming should be "batteri life" or "batteri lif" depending on algorithm).
D. Keyword selection:
   1. Select 1-3 **high-value** keywords/phrases that best capture actionable topics, bugs, or product areas in the post.
   2. Order by importance (most important first).
   3. If more than three candidate keywords are equally important, pick the top 3 by frequency and specificity (prefer domain nouns and verbs over adjectives and adverbs).
   4. If no high-value keywords exist (e.g., post is a rant or empty/only PII), return an empty array **only** if SAFETY_RULES require "unsafe". Otherwise return the single best stemmed keyword.
E. Keyword format:
   - Lowercase, punctuation removed, stemmed, trimmed, single spaces between tokens, no more than two words per keyword (prefer one), e.g. "login fail", "crash", "battery drain".

--- SENTIMENT RULES ---
1. Consider explicit language, implied meaning, emotional tone, punctuation, emojis, and context.
2. Sarcasm/irony/backhanded compliments:
   - If sarcasm or irony is detected (contradiction between literal positive words and context that implies criticism), classify as **negative**.
3. Mixed sentiment:
   - If the post contains both praise and criticism, choose the **predominant** overall intent. If equal weight and one of the two is negative or mocking, prefer **negative**.
4. Rules of thumb:
   - Positive: explicit praise, thanks, excitement, constructive suggestions framed positively.
   - Neutral: factual statements, feature requests without affect, bug reports stated calmly without emotion.
   - Negative: complaints, insults, strong dissatisfaction, threats, profanity directed at product/people, sarcasm, passive-aggressive or backhanded praise followed by criticism.
5. Emoji guidance:
   - Map common emojis to sentiment signals (e.g., 👍, 🙂 -> positive; 😡, 👎 -> negative; 😐 -> neutral). Emojis do not override clear textual sentiment but help disambiguate short texts.
6. Output must be one of "positive", "neutral", or "negative".

--- SAFETY RULES (must be enforced BEFORE keywords are returned) ---
Mark **"unsafe"** and set "keywords: []" if any of the following apply:
A. Non-constructive content:
   - The post is a rant, low-effort vent, or contains no actionable feedback (e.g., "Ughhh this app sucks!!" with no details).
B. Hate, harassment, threats:
   - Any targeted hate speech, demeaning content toward protected classes, or personal attacks (explicit or subtle).
C. Profanity / obscene language:
   - Posts containing profanity, sexual explicitness used abusively, or obscene content that is not constructive.
D. Threats of violence or calls for harm.
E. Coded hostile language, dog whistles, or stereotypes implying hostility.
F. Personal Identifiable Information (PII):
   - Posts that contain personal emails, phone numbers, home addresses, national ID numbers, or user full names intended to identify a private person (unless anonymized); treat as unsafe.
G. Sarcasm/passive-aggressive remarks that demean or belittle a person or group (even if superficially phrased as praise).
H. Ambiguously mocking or condescending content that could reasonably be interpreted as harmful.
If none of the above apply, mark **"safe"**.

--- ADDITIONAL TECHNICAL RULES & EDGE CASES ---
1. Short posts (<=5 tokens): use emojis and punctuation as tie-breakers. If ambiguous and contains only a positive emoji, mark positive; if only a negative emoji, mark negative; if ambiguous, mark neutral.
2. Repeated emphasis (e.g., "soooo bad!!!") amplifies negative sentiment — treat as stronger negative.
3. Numbers: treat numeric error codes (e.g., "500", "404") as part of a keyword if adjacent to a technical term (e.g., "error 500" -> keyword "error 500" after normalization).
4. Multi-language posts: translate to English for processing, but if translation is unreliable and meaning is unclear, default to "neutral" unless unsafe content is detected.
5. Emoji-only or punctuation-only posts: interpret emoji sentiment; if only punctuation (e.g., "!!!"), classify as "neutral" unless clearly attached to a complaint elsewhere.
6. If the post includes steps-to-reproduce or logs: extract the actionable root cause/feature area as keyword (e.g., "app crash on save" -> "crash", "save").
7. Do not extract or include any PII in keywords. If the only meaningful tokens are PII, mark unsafe and "keywords: []".

--- GENERIC TERM BLACKLIST (do not use these as keywords) ---
good, bad, nice, great, love, use, because, from, thing, stuff, help, thanks, thank, issue, problem, app, product, feature, user

--- EXAMPLES (input -> expected JSON) ---
1) Post: "The app keeps crashing when I try to save a file. Please fix!"
   -> { "keywords": ["crash", "save"], "sentiment": "negative", "safety": "safe" }

2) Post: "Love the redesign — cleaner and faster."
   -> { "keywords": ["redesign"], "sentiment": "positive", "safety": "safe" }

3) Post: "Ughhh this is garbage!!!"
   -> { "keywords": [], "sentiment": "negative", "safety": "unsafe" }  // rant, non-actionable -> unsafe

4) Post: "Login 500 error keeps happening for new users."
   -> { "keywords": ["login", "error 500"], "sentiment": "negative", "safety": "safe" }

5) Post: "Nice job, but the battery drains so fast it's unusable :/ "
   -> { "keywords": ["battery drain"], "sentiment": "negative", "safety": "safe" } // backhanded compliment -> negative

6) Post: "Contact me at john@example.com — I can help."
   -> { "keywords": [], "sentiment": "neutral", "safety": "unsafe" } // PII → unsafe

--- VALIDATION CHECKLIST (before returning JSON) ---
- JSON only, no extra text.
- "keywords" length == 1..3 except when "safety" == "unsafe" then keywords == [].
- All keywords are lowercased, stemmed, no punctuation, max two words.
- "sentiment" is one of the three allowed values.
- "safety" is "safe" or "unsafe".

If you cannot confidently determine sentiment or keywords due to ambiguity but the post is not unsafe, make a best-effort decision per rules above (prefer neutral over guessing positive). Do not ask follow-up questions or return partial analysis — produce the JSON result now.

Post: "{CONTENT}"
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
              minItems: 1,
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
