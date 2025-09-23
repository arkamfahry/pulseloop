<script lang="ts">
	import { api } from '$convex/_generated/api';
	import SearchFilters from '$lib/dashboard/SearchFilters.svelte';
	import { useQuery } from 'convex-svelte';
	import WordCloud from '$lib/cloud/WordCloud.svelte';
	import type { Id } from '$convex/_generated/dataModel';
	import { Button, Spinner } from 'flowbite-svelte';
	import FeedbackCard from '$lib/dashboard/FeedbackCard.svelte';
	import { CloseOutline } from 'flowbite-svelte-icons';

	let filters = $state({
		content: '',
		sentiment: undefined as 'positive' | 'negative' | 'neutral' | undefined,
		status: undefined as 'open' | 'noted' | undefined,
		votes: undefined as 'asc' | 'desc' | undefined,
		from: undefined as Date | undefined,
		to: undefined as Date | undefined
	});

	const keywordCloudQuery = useQuery(api.keyword.getKeywordCloud, () => ({
		content: filters.content,
		sentiment: filters.sentiment,
		status: filters.status,
		votes: filters.votes,
		from: filters.from ? filters.from.getTime() : undefined,
		to: filters.to ? filters.to.getTime() : undefined
	}));

	let selectedKeywordId = $state('');

	function handleNodeClick(id: string) {
		selectedKeywordId = id;
	}

	function resetSelectedKeyword() {
		selectedKeywordId = '';
	}

	const listFeedback = $derived.by(() => {
		return selectedKeywordId
			? useQuery(api.feedback.listPublishedFeedbackByKeywordId, () => ({
					sentiment: filters.sentiment,
					status: filters.status,
					votes: filters.votes,
					from: filters.from ? filters.from.getTime() : undefined,
					to: filters.to ? filters.to.getTime() : undefined,
					keywordId: selectedKeywordId as Id<'keywords'>
				}))
			: null;
	});
</script>

<main class="flex h-screen min-w-0 flex-col">
	<section class="flex justify-center">
		<SearchFilters type="full" bind:filters />
	</section>

	<section class="flex min-h-0 flex-1 flex-row items-start gap-4 px-1 pt-4">
		<div
			class="flex h-[30rem] flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="h-full w-full flex-1">
				<WordCloud query={keywordCloudQuery} onNodeClick={handleNodeClick} />
			</div>
		</div>

		{#if listFeedback !== null}
			<div
				class="relative flex h-[30rem] flex-1 flex-col overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="mb-8 flex items-center justify-between">
					<Button
						class="absolute top-2 right-2 z-10 p-1"
						color="light"
						size="sm"
						onclick={() => resetSelectedKeyword()}
					>
						<CloseOutline size="md" />
					</Button>
				</div>
				<div>
					{#if listFeedback.isLoading}
						<div class="flex h-full items-center justify-center">
							<Spinner />
						</div>
					{:else if listFeedback.error}
						<p>Error: {listFeedback.error.message}</p>
					{:else if listFeedback.data}
						{#each listFeedback.data as feedback}
							{#if feedback}
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
							{/if}
						{/each}
					{:else}
						<p class="text-gray-500">No feedback found.</p>
					{/if}
				</div>
			</div>
		{/if}
	</section>
</main>
