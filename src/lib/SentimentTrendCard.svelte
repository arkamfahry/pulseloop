<script lang="ts">
	import type { OverallSentiment } from '$convex/sentiment';
	import { Card, Spinner } from 'flowbite-svelte';

	export let isLoading: boolean;
	export let heading: string;
	export let content: OverallSentiment | null | undefined;

	function sentimentColor(sentiment?: string) {
		if (sentiment === 'positive') return 'text-green-400';
		if (sentiment === 'negative') return 'text-red-400';
		return 'text-gray-400';
	}
</script>

<Card class="flex min-h-24 flex-col justify-center gap-1.5 rounded-2xl p-6 text-lg shadow-sm">
	{#if isLoading}
		<div class="flex h-full flex-1 items-center justify-center">
			<Spinner />
		</div>
	{:else}
		<span class="text-2xl font-medium text-gray-500">{heading}</span>
		<span class="mt-1 text-4xl font-semibold {sentimentColor(content?.sentiment)}">
			{#if content}
				{content.percentage}% {content.sentiment.charAt(0).toUpperCase() +
					content.sentiment.slice(1)}
			{:else}
				0% Neutral
			{/if}
		</span>
	{/if}
</Card>
