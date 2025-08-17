import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createFeedback = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const feedbackId = await ctx.db.insert("feedbacks", {
      content: args.content,
      user: userId,
      isPublished: false,
    });

    await ctx.scheduler.runAfter(0, internal.analysis.AnalyzePost, {
      feedbackId: feedbackId,
      content: args.content,
    });

    await ctx.scheduler.runAfter(0, internal.analysis.EmbedPost, {
      feedbackId: feedbackId,
      content: args.content,
    });
  },
});

export const publishFeedback = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    sentiment: v.union(
      v.literal("positive"),
      v.literal("neutral"),
      v.literal("negative"),
    ),
    safety: v.union(
      v.literal("safe"),
      v.literal("unsafe"),
      v.literal("ambiguous"),
    ),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.safety === "safe") {
      await ctx.db.patch(args.feedbackId, {
        sentiment: args.sentiment,
        safety: args.safety,
        keywords: args.keywords,
        isPublished: true,
      });
    } else {
      await ctx.db.patch(args.feedbackId, {
        sentiment: args.sentiment,
        safety: args.safety,
        keywords: args.keywords,
        isPublished: false,
      });
    }
  },
});

export const embedFeedback = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedbackId, {
      contentEmbedding: args.embedding,
    });
  },
});

export const upvotePost = mutation({
  args: {
    feedbackId: v.id("feedbacks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_feedback_user", (q) =>
        q.eq("feedback", args.feedbackId).eq("user", userId),
      )
      .first();
    if (existingVote) {
      return;
    }

    await ctx.db.insert("votes", {
      feedback: args.feedbackId,
      user: userId,
    });

    const post = await ctx.db.get(args.feedbackId);
    if (post) {
      await ctx.db.patch(args.feedbackId, {
        votes: (post.votes ?? 0) + 1,
      });
    }
  },
});

export const getPost = query({
  args: { feedbackId: v.id("feedbacks") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.feedbackId);
    return post;
  },
});

export const listPosts = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("feedbacks")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();
  },
});
