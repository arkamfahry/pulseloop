import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPost = mutation({
    args: { 
        content: v.string(),
    },
    handler: async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const postId = await ctx.db.insert("posts", {
        content: args.content, 
        user: userId,
        isPublished: false,
      });

      await ctx.scheduler.runAfter(0, internal.analysis.AnalyzePost, {
        postId: postId,
        content: args.content,
      });

      await ctx.scheduler.runAfter(0, internal.analysis.EmbedPost, {
        postId: postId,
        content: args.content,
      });
    },
});

export const publishPost = internalMutation({
    args: { 
        postId: v.id("posts"),
        sentiment: v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative")),
        safety: v.union(v.literal("safe"), v.literal("unsafe"), v.literal("ambiguous")),
        keywords: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.safety === "safe") {
          await ctx.db.patch(args.postId, {
            sentiment: args.sentiment,
            safety: args.safety,
            keywords: args.keywords,
            isPublished: true,
          });    
        } else {
          await ctx.db.patch(args.postId, {
            sentiment: args.sentiment,
            safety: args.safety,
            keywords: args.keywords,
            isPublished: false,
          });
        }
    },
});

export const embedPost = internalMutation({
    args: {
        postId: v.id("posts"),
        embedding: v.array(v.number()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.postId, {
            contentEmbedding: args.embedding,
        });
    },
});


export const upvotePost = mutation({
    args: { 
      postId: v.id("posts")
    },
    handler: async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const existingVote = await ctx.db.query("votes")
        .withIndex("vote_by_post_user", (q) => q.eq("post", args.postId).eq("user", userId)).first();
      if (existingVote) {
          return;
      }

      await ctx.db.insert("votes", {
          post: args.postId,
          user: userId,
      });

      const post = await ctx.db.get(args.postId);
      if (post) {
          await ctx.db.patch(args.postId, {
              votes: (post.votes ?? 0) + 1,
          });
      }
    },
});


export const getPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    return post;
  },
});

export const listPosts = query({
  handler: async (ctx) => {
    return await ctx.db.query("posts")
      .filter(q => q.eq(q.field("isPublished"), true)).collect();
  },
})

