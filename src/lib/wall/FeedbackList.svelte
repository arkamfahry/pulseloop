<!-- FeedbackList.svelte -->
<script lang="ts">
	import type { api } from '$convex/_generated/api';
	import FeedbackCard from '$lib/wall/FeedbackCard.svelte';
	import type { FunctionReturnType } from 'convex/server';
	import { Spinner } from 'flowbite-svelte';

	interface Props {
		query: {
			isLoading: boolean;
			data: FunctionReturnType<typeof api.feedback.listPublishedFeedback> | null | undefined;
			error?: Error | null;
		};
	}

	let props: Props = $props();
</script>

<main class="flex flex-1 flex-col items-center px-1 py-2">
	<div class="w-full max-w-3xl space-y-1">
		{#if props.query.isLoading}
			<div class="flex h-screen items-center justify-center">
				<Spinner />
			</div>
		{:else if props.query.error}
			<p>Error: {props.query.error.message}</p>
		{:else}
			{#each props.query.data ?? [] as feedback}
				<FeedbackCard
					id={feedback._id}
					userName={feedback.user?.name ?? 'Anonymous'}
					date={feedback.createdAt}
					content={feedback.content ?? ''}
					keywords={feedback.keywords ?? []}
					status={feedback.status ?? 'open'}
					sentiment={feedback.sentiment ?? 'neutral'}
					votes={feedback.votes ?? 0}
				/>
			{/each}
		{/if}
	</div>
</main>
