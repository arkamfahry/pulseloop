import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	users: defineTable({
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		role: v.optional(v.union(v.literal('user'), v.literal('admin')))
	}).index('email', ['email']),

	feedbacks: defineTable({
		content: v.string(),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		keywords: v.optional(v.array(v.string())),
		approval: v.optional(v.union(v.literal('approved'), v.literal('rejected'))),
		status: v.optional(v.union(v.literal('open'), v.literal('noted'))),
		votes: v.number(),
		published: v.boolean(),
		userId: v.id('users'),
		embeddingId: v.optional(v.id('feedbackEmbeddings')),
		createdAt: v.number()
	})
		.index('by_status', ['status'])
		.index('by_embeddingId', ['embeddingId'])
		.index('by_userId_published_votes', ['userId', 'published', 'votes'])
		.index('by_published_sentiment_createdAt_votes', [
			'published',
			'sentiment',
			'createdAt',
			'votes'
		])
		.index('by_published_status_createdAt_votes', ['published', 'status', 'createdAt', 'votes'])
		.index('by_published_sentiment_status_createdAt_votes', [
			'published',
			'sentiment',
			'status',
			'createdAt',
			'votes'
		])
		.searchIndex('by_content', {
			searchField: 'content',
			filterFields: ['published', 'sentiment', 'status', 'userId']
		}),

	feedbackEmbeddings: defineTable({
		embedding: v.optional(v.array(v.number())),
		sentiment: v.optional(
			v.union(v.literal('positive'), v.literal('negative'), v.literal('neutral'))
		),
		keywords: v.optional(v.array(v.string())),
		userId: v.optional(v.id('users'))
	}).vectorIndex('by_embedding', {
		vectorField: 'embedding',
		dimensions: 1536,
		filterFields: ['sentiment', 'keywords', 'userId']
	}),

	votes: defineTable({
		feedbackId: v.id('feedbacks'),
		userId: v.id('users')
	}).index('by_feedbackId_userId', ['feedbackId', 'userId']),

	keywords: defineTable({
		keyword: v.string()
	}).index('by_keyword', ['keyword']),

	feedbackKeywords: defineTable({
		feedbackId: v.id('feedbacks'),
		keywordId: v.id('keywords')
	})
		.index('by_feedbackId', ['feedbackId'])
		.index('by_keywordId', ['keywordId'])
		.index('by_feedbackId_keywordId', ['feedbackId', 'keywordId'])
});
