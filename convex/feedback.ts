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

    await ctx.scheduler.runAfter(0, internal.analysis.moderateFeedback, {
      feedbackId: feedbackId,
      content: args.content,
    });
  },
});

export const moderateFeedback = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    approval: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    if (args.approval === "approved") {
      await ctx.db.patch(args.feedbackId, {
        approval: args.approval,
      });

      const feedback = await ctx.db.get(args.feedbackId);
      if (!feedback) {
        throw new Error("Feedback not found");
      }

      await ctx.scheduler.runAfter(0, internal.analysis.analyzeFeedback, {
        feedbackId: feedback._id,
        content: feedback.content,
      });
    } else {
      await ctx.db.patch(args.feedbackId, {
        approval: args.approval,
      });
    }
  },
});

export const analyzeFeedback = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    sentiment: v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral"),
    ),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedbackId, {
      sentiment: args.sentiment,
      keywords: args.keywords,
      isPublished: true,
    });

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    await ctx.scheduler.runAfter(0, internal.analysis.embedFeedback, {
      feedbackId: feedback._id,
      content: feedback.content,
    });
  },
});

export const embedFeedback = internalMutation({
  args: {
    feedbackId: v.id("feedbacks"),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedbackId, {
      embedding: args.embedding,
    });
  },
});

export const upvoteFeedback = mutation({
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
