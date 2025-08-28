import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
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
		votes: v.optional(v.number()),
		published: v.boolean(),
		userId: v.id('users'),
		embeddingId: v.optional(v.id('feedbackEmbeddings'))
	})
		.index('by_embeddingId', ['embeddingId'])
		.index('by_userId_votes', ['userId', 'votes'])
		.index('by_published_votes', ['published', 'votes'])
		.index('by_published_sentiment_votes', ['published', 'sentiment', 'votes'])
		.index('by_published_status_votes', ['published', 'status', 'votes'])
		.index('by_published_sentiment_status_votes', ['published', 'sentiment', 'status', 'votes'])
		.searchIndex('by_content', {
			searchField: 'content',
			filterFields: ['published', 'sentiment', 'topics', 'status', 'userId']
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

	topics: defineTable({
		topic: v.string(),
		count: v.number()
	}).index('by_topic', ['topic']),

	feedbackTopics: defineTable({
		feedbackId: v.id('feedbacks'),
		topicId: v.id('topics')
	})
		.index('by_feedbackId', ['feedbackId'])
		.index('by_topicId', ['topicId'])
		.index('by_feedbackId_topicId', ['feedbackId', 'topicId'])
});
