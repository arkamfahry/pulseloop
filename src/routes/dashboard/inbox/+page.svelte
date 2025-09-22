<script lang="ts">
	import { api } from '$convex/_generated/api';
	import SearchFilters from '$lib/dashboard/SearchFilters.svelte';
	import FeedbackCard from '$lib/dashboard/FeedbackCard.svelte';
	import { useQuery } from 'convex-svelte';
	import { Spinner } from 'flowbite-svelte';

	let filters = $state({
		content: '',
		sentiment: undefined as 'positive' | 'negative' | 'neutral' | undefined,
		status: undefined as 'open' | 'noted' | undefined,
		votes: undefined as 'asc' | 'desc' | undefined,
		from: undefined as Date | undefined,
		to: undefined as Date | undefined
	});

	const publishedFeedbackQuery = useQuery(api.feedback.searchPublishedFeedback, () => ({
		content: filters.content,
		sentiment: filters.sentiment,
		status: filters.status,
		votes: filters.votes,
		from: filters.from ? filters.from.getTime() : undefined,
		to: filters.to ? filters.to.getTime() : undefined
	}));
</script>

<main class="flex h-screen min-w-0 flex-col">
	<section class="sticky top-0 z-10 flex justify-center bg-white">
		<SearchFilters type="full" bind:filters />
	</section>

	<section class="flex min-h-0 flex-1 flex-col items-center gap-4 px-1 pt-4">
		{#if publishedFeedbackQuery.isLoading}
			<div class="flex h-full items-center justify-center">
				<Spinner />
			</div>
		{:else if publishedFeedbackQuery.error}
			<p>Error: {publishedFeedbackQuery.error.message}</p>
		{:else if publishedFeedbackQuery.data}
			{#each publishedFeedbackQuery.data as feedback}
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
		{:else}
			<p class="text-gray-500">No feedback found.</p>
		{/if}
	</section>
</main>
