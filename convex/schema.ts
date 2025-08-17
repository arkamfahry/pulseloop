import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  }).index("email", ["email"]),

  posts: defineTable({
    content: v.string(),
    contentEmbedding: v.optional(v.array(v.number())),
    sentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("negative"),
        v.literal("neutral"),
      ),
    ),
    keywords: v.optional(v.array(v.string())),
    keywordEmbedding: v.optional(v.array(v.number())),
    safety: v.optional(
      v.union(v.literal("safe"), v.literal("unsafe"), v.literal("ambiguous")),
    ),
    user: v.id("users"),
    votes: v.optional(v.number()),
    isPublished: v.boolean(),
  }).index("post_by_user", ["user"]),

  votes: defineTable({
    post: v.id("posts"),
    user: v.id("users"),
  }).index("vote_by_post_user", ["post", "user"]),

  reports: defineTable({
    name: v.string(),
    content: v.string(),
    posts: v.array(v.id("posts")),
    user: v.id("users"),
  }),
});
