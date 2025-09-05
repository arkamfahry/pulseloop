<script lang="ts">
	import { Card, Badge, Button } from 'flowbite-svelte';
	import { CaretUpOutline } from 'flowbite-svelte-icons';

	interface Props {
		userName: string;
		date: string;
		votes: number;
		content: string;
		keywords: string[];
		status: 'open' | 'closed';
		sentiment: 'positive' | 'neutral' | 'negative';
	}

	let { userName, date, votes, content, keywords, status, sentiment }: Props = $props();

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
				return 'yellow';
		}
	}
</script>

<Card
	class="relative mx-auto max-w-3xl rounded-2xl border border-gray-200 p-4 shadow dark:border-gray-700"
>
	<Button
		class="absolute top-4 right-4 z-10 flex items-center justify-center space-x-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 dark:bg-gray-800"
	>
		<CaretUpOutline class="h-4 w-4 text-gray-400" />
		<span class="text-sm font-medium text-gray-600 dark:text-gray-400">{votes}</span>
	</Button>

	<div class="flex min-h-24 flex-col">
		<div class="mb-1 flex items-center space-x-2">
			<span class="font-semibold text-gray-900 dark:text-white">{userName}</span>
			<span class="text-sm text-gray-500 dark:text-gray-400">{date}</span>
		</div>

		<p class="my-4 text-base leading-relaxed text-gray-900 dark:text-gray-300">
			{content}
		</p>

		<div class="flex flex-wrap items-center gap-2">
			{#each keywords as keyword}
				<Badge
					color="gray"
					class="border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
					rounded>{keyword}</Badge
				>
			{/each}
		</div>
	</div>

	<div class="absolute right-4 bottom-4 flex flex-row items-end gap-2">
		<Badge color={getStatusColor(status)} class="border px-3 py-1 text-xs font-medium" rounded>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</Badge>
		<Badge
			color={getSentimentColor(sentiment)}
			class="border px-3 py-1 text-xs font-medium"
			rounded
		>
			{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
		</Badge>
	</div>
</Card>
