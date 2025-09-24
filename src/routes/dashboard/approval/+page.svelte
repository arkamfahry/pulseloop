<script lang="ts">
	import { api } from '$convex/_generated/api';
	import SearchFilters from '$lib/dashboard/SearchFilters.svelte';
	import { useQuery } from 'convex-svelte';
	import { Spinner } from 'flowbite-svelte';
	import FeedBackApprovalCard from '$lib/dashboard/FeedBackApprovalCard.svelte';

	let filters = $state({
		content: '',
		sentiment: undefined as 'positive' | 'negative' | 'neutral' | undefined,
		status: undefined as 'open' | 'noted' | undefined,
		votes: undefined as 'asc' | 'desc' | undefined,
		from: undefined as Date | undefined,
		to: undefined as Date | undefined
	});

	const unpublishedFeedbackQuery = useQuery(api.feedback.listUnpublishedFeedback, () => ({
		content: filters.content,
		from: filters.from ? filters.from.getTime() : undefined,
		to: filters.to ? filters.to.getTime() : undefined
	}));
</script>

<main class="flex h-screen min-w-0 flex-col">
	<section class="sticky z-10 flex justify-center bg-white pt-4">
		<SearchFilters type="simple" bind:filters />
	</section>

	<section class="flex flex-1 flex-col items-center gap-2 overflow-y-auto py-4">
		{#if unpublishedFeedbackQuery.isLoading}
			<div class="flex h-full items-center justify-center">
				<Spinner />
			</div>
		{:else if unpublishedFeedbackQuery.error}
			<p>Error: {unpublishedFeedbackQuery.error.message}</p>
		{:else if unpublishedFeedbackQuery.data}
			{#each unpublishedFeedbackQuery.data as feedback}
				<FeedBackApprovalCard
					id={feedback._id}
					userName={feedback.user?.name ?? 'Anonymous'}
					date={feedback._creationTime}
					content={feedback.content}
					votes={feedback.votes}
				/>
			{/each}
		{:else}
			<p class="text-gray-500">No feedback found.</p>
		{/if}
	</section>
</main>
