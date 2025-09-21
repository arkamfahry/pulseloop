<script lang="ts">
	import type { api } from '$convex/_generated/api';
	import FeedbackCard from '$lib/dashboard/FeedbackCard.svelte';
	import type { FunctionReturnType } from 'convex/server';
	import { Spinner } from 'flowbite-svelte';

	interface Props {
		query: {
			isLoading: boolean;
			data: FunctionReturnType<typeof api.feedback.getTopFeedback> | null | undefined;
			error?: Error | null;
		};
	}

	let props: Props = $props();
</script>

<div class="mt-4 flex flex-col gap-4">
	{#if props.query.isLoading}
		<div class="flex h-full flex-1 items-center justify-center">
			<Spinner />
		</div>
	{:else if props.query.error}
		<p class="text-red-500">Error: {props.query.error.message}</p>
	{:else if props.query.data}
		{#each props.query.data as feedback}
			<FeedbackCard
				id={feedback._id}
				userName={feedback.user?.name ?? 'Anonymous'}
				date={feedback.createdAt}
				votes={feedback.votes}
				content={feedback.content}
				keywords={feedback.keywords ?? []}
				status={feedback.status ?? 'open'}
				sentiment={feedback.sentiment ?? 'neutral'}
			/>
		{/each}
	{/if}
</div>
