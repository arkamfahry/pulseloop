import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

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
		role: v.optional(v.union(v.literal('user'), v.literal('admin')))
	}).index('email', ['email']),

	feedbacks: defineTable({
		content: v.string(),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		topics: v.optional(v.array(v.string())),
		approval: v.optional(v.union(v.literal('approved'), v.literal('rejected'))),
		status: v.optional(v.union(v.literal('open'), v.literal('noted'))),
		userId: v.id('users'),
		votes: v.optional(v.number()),
		isPublished: v.boolean(),
		embeddingId: v.optional(v.id('feedbackEmbeddings'))
	})
		.index('by_user', ['userId'])
		.index('by_isPublished', ['isPublished'])
		.index('by_embeddingId', ['embeddingId'])
		.searchIndex('by_content', {
			searchField: 'content',
			filterFields: ['isPublished', 'sentiment', 'topics', 'userId']
		}),

	feedbackEmbeddings: defineTable({
		embedding: v.optional(v.array(v.number())),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		topics: v.optional(v.array(v.string())),
		userId: v.optional(v.id('users'))
	}).vectorIndex('by_embedding', {
		vectorField: 'embedding',
		dimensions: 1536,
		filterFields: ['sentiment', 'topics', 'userId']
	}),

	votes: defineTable({
		feedbackId: v.id('feedbacks'),
		userId: v.id('users')
	}).index('by_feedbackId_userId', ['feedbackId', 'userId']),

	comments: defineTable({
		content: v.string(),
		feedbackId: v.id('feedbacks'),
		userId: v.id('users')
	}).index('by_feedbackId_userId', ['feedbackId', 'userId']),

	topics: defineTable({
		topic: v.string()
	}).index('by_topic', ['topic']),

	feedbackTopics: defineTable({
		feedbackId: v.id('feedbacks'),
		topicId: v.id('topics')
	}).index('by_feedbackId_topicId', ['feedbackId', 'topicId'])
});
