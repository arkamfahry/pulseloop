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

  feedbacks: defineTable({
    content: v.string(),
    embedding: v.optional(v.array(v.number())),
    sentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("negative"),
        v.literal("neutral"),
      ),
    ),
    keywords: v.optional(v.array(v.string())),
    approval: v.optional(v.union(v.literal("approved"), v.literal("rejected"))),
    user: v.id("users"),
    votes: v.optional(v.number()),
    isPublished: v.boolean(),
  })
    .index("by_user", ["user"])
    .index("by_isPublished", ["isPublished"])
    .searchIndex("by_content", {
      searchField: "content",
      filterFields: [
        "user",
        "isPublished",
        "sentiment",
        "approval",
        "keywords",
      ],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: [
        "user",
        "isPublished",
        "sentiment",
        "approval",
        "keywords",
      ],
    }),

  votes: defineTable({
    feedback: v.id("feedbacks"),
    user: v.id("users"),
  }).index("by_feedback_user", ["feedback", "user"]),

  keywords: defineTable({
    keyword: v.string(),
    count: v.optional(v.number()),
  }).index("by_keyword", ["keyword"]),

  feedbackKeywords: defineTable({
    feedback: v.id("feedbacks"),
    keyword: v.id("keywords"),
  }).index("by_feedback_keyword", ["feedback", "keyword"]),
});
