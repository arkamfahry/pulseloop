<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { useConvexClient } from 'convex-svelte';
	import { Badge, Button, Card } from 'flowbite-svelte';
	import { CaretUpOutline } from 'flowbite-svelte-icons';

	const client = useConvexClient();

	async function toggleFeedbackVote() {
		try {
			await client.mutation(api.feedback.toggleFeedbackVote, { feedbackId: props.id });
		} catch (error) {
			console.error('Error up voting feedback:', error);
		}
	}

	interface Props {
		id: Id<'feedbacks'>;
		userName: string;
		date: number;
		votes: number;
		content: string;
		keywords: string[];
		status: 'open' | 'noted';
		sentiment: 'positive' | 'neutral' | 'negative';
	}

	let props: Props = $props();

	function getStatusColor(status: string) {
		return status === 'open' ? 'red' : 'green';
	}

	function getSentimentColor(sentiment: string) {
		switch (sentiment) {
			case 'positive':
				return 'green';
			case 'negative':
				return 'red';
			case 'neutral':
			default:
				return 'blue';
		}
	}
</script>

<Card
	class="relative mx-auto max-w-3xl rounded-2xl border border-gray-200 p-4 shadow dark:border-gray-700"
>
	<div class="flex w-full flex-col">
		<div class="mb-4 flex w-full items-start justify-between gap-2">
			<div class="flex items-center gap-2">
				<span class="font-semibold text-gray-900 dark:text-white"
					>{props.userName ?? 'Anonymous'}</span
				>
				<span class="text-sm text-gray-500 dark:text-gray-400"
					>{new Date(props.date).toLocaleDateString(undefined, {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})}</span
				>
			</div>
			<div class="flex items-center justify-end">
				<Button color="light" size="sm" onclick={() => toggleFeedbackVote()}>
					<CaretUpOutline size="sm" class="text-gray-400" />
					<span class="text-sm font-medium text-gray-600 dark:text-gray-400">{props.votes}</span>
				</Button>
			</div>
		</div>
		<p class="mb-4 text-base leading-relaxed text-gray-900 dark:text-gray-300">
			{props.content}
		</p>
		<div class="mt-4 flex w-full flex-row items-start justify-between gap-2">
			<div class="flex min-w-0 flex-1 flex-wrap gap-2">
				{#each props.keywords as keyword}
					<Badge
						color="gray"
						class="rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium break-words text-gray-700"
						>{keyword}</Badge
					>
				{/each}
			</div>
			<div class="ml-2 flex shrink-0 flex-row items-center gap-2">
				<Badge
					color={getSentimentColor(props.sentiment)}
					class="rounded-md border px-3 py-1 text-xs font-medium"
				>
					{props.sentiment.charAt(0).toUpperCase() + props.sentiment.slice(1)}
				</Badge>
				<Badge
					color={getStatusColor(props.status)}
					class="rounded-md border px-3 py-1 text-xs font-medium"
				>
					{props.status.charAt(0).toUpperCase() + props.status.slice(1)}
				</Badge>
			</div>
		</div>
	</div>
</Card>
