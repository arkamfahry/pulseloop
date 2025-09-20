<script lang="ts">
	import type { api } from '$convex/_generated/api';
	import type { FunctionReturnType } from 'convex/server';

	import { Card, Spinner } from 'flowbite-svelte';

	interface Props {
		heading: string;
		query: {
			isLoading: boolean;
			data: FunctionReturnType<typeof api.sentiment.getOverallSentiment> | null | undefined;
			error?: Error | null;
		};
	}

	let props: Props = $props();

	function sentimentColor(sentiment?: string) {
		if (sentiment === 'positive') return 'text-green-800';
		if (sentiment === 'negative') return 'text-red-800';
		return 'text-blue-800';
	}
</script>

<Card class="flex min-h-24 flex-col justify-center gap-1.5 rounded-2xl p-6 text-lg shadow-sm">
	{#if props.query.isLoading}
		<div class="flex h-full flex-1 items-center justify-center">
			<Spinner />
		</div>
	{:else if props.query.error}
		<div class="flex h-full flex-1 items-center justify-center text-red-600">
			Error: {props.query.error.message}
		</div>
	{:else}
		<span class="text-2xl font-medium text-gray-500">{props.heading}</span>
		<span class="mt-1 text-4xl font-semibold {sentimentColor(props.query.data?.sentiment)}">
			{#if props.query.data}
				{props.query.data.percentage}% {props.query.data.sentiment.charAt(0).toUpperCase() +
					props.query.data.sentiment.slice(1)}
			{:else}
				0% Neutral
			{/if}
		</span>
	{/if}
</Card>
