<script lang="ts">
	import type { OverallSentiment } from '$convex/sentiment';
	import { Card, Spinner } from 'flowbite-svelte';

	interface Props {
		isLoading: boolean;
		heading: string;
		data: OverallSentiment | null | undefined;
		error?: Error | null;
	}

	let props: Props = $props();

	function sentimentColor(sentiment?: string) {
		if (sentiment === 'positive') return 'text-green-700';
		if (sentiment === 'negative') return 'text-red-700';
		return 'text-gray-700';
	}
</script>

<Card class="flex min-h-24 flex-col justify-center gap-1.5 rounded-2xl p-6 text-lg shadow-sm">
	{#if props.isLoading}
		<div class="flex h-full flex-1 items-center justify-center">
			<Spinner />
		</div>
	{:else if props.error}
		<div class="flex h-full flex-1 items-center justify-center text-red-600">
			Error: {props.error.message}
		</div>
	{:else}
		<span class="text-2xl font-medium text-gray-500">{props.heading}</span>
		<span class="mt-1 text-4xl font-semibold {sentimentColor(props.data?.sentiment)}">
			{#if props.data}
				{props.data.percentage}% {props.data.sentiment.charAt(0).toUpperCase() +
					props.data.sentiment.slice(1)}
			{:else}
				0% Neutral
			{/if}
		</span>
	{/if}
</Card>
