<script lang="ts">
	import { api } from '$convex/_generated/api';
	import SearchFilters from '$lib/dashboard/SearchFilters.svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import WordCloud from '$lib/cloud/WordCloud.svelte';
	import type { Id } from '$convex/_generated/dataModel';
	import { Button, Card, Checkbox, Spinner } from 'flowbite-svelte';
	import FeedbackCard from '$lib/dashboard/FeedbackCard.svelte';
	import { CheckOutline, CloseOutline, WandMagicSparklesOutline } from 'flowbite-svelte-icons';

	const client = useConvexClient();

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
	let selectedFeedbackIds = $state<Id<'feedbacks'>[]>([]);
	let showSummaryModal = $state(false);
	let loadSummary = $state(false);
	let summaryText = $state('');

	function handleNodeClick(id: string) {
		selectedKeywordId = id;
		selectedFeedbackIds = [];
	}

	function resetSelectedKeyword() {
		selectedKeywordId = '';
		selectedFeedbackIds = [];
	}

	function handleSelectionChange(id: Id<'feedbacks'>, checked: boolean) {
		if (checked) {
			if (!selectedFeedbackIds.includes(id)) {
				selectedFeedbackIds = [...selectedFeedbackIds, id];
			}
		} else {
			selectedFeedbackIds = selectedFeedbackIds.filter((selectedId) => selectedId !== id);
		}
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

	const allFeedbackIds = $derived.by(() => {
		if (!listFeedback?.data) return [];
		return listFeedback.data
			.filter(
				(feedback): feedback is NonNullable<typeof feedback> =>
					feedback !== null && feedback !== undefined
			)
			.map((feedback) => feedback._id);
	});

	const isAllSelected = $derived.by(() => {
		const allIds = allFeedbackIds;
		if (allIds.length === 0) return false;
		if (selectedFeedbackIds.length !== allIds.length) return false;

		for (const id of allIds) {
			if (!selectedFeedbackIds.includes(id)) {
				return false;
			}
		}
		return true;
	});

	const isIndeterminate = $derived.by(() => {
		return selectedFeedbackIds.length > 0 && selectedFeedbackIds.length < allFeedbackIds.length;
	});

	function handleSelectAll(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.checked) {
			selectedFeedbackIds = [...allFeedbackIds];
		} else {
			selectedFeedbackIds = [];
		}
	}

	async function summarizeSelectedFeedback() {
		if (selectedFeedbackIds.length === 0) return;
		try {
			loadSummary = true;
			const result = await client.action(api.summarize.summarizeFeedback, {
				feedbackIds: selectedFeedbackIds
			});
			summaryText = result.summary;
			showSummaryModal = true;
		} catch (error) {
			console.error('Error summarizing feedback:', error);
		} finally {
			loadSummary = false;
		}
	}

	function closeSummaryModal() {
		showSummaryModal = false;
	}

	async function markAsNoted() {
		if (selectedFeedbackIds.length === 0) return;
		try {
			await client.mutation(api.feedback.setFeedbackStatusByIds, {
				feedbackIds: selectedFeedbackIds
			});
		} catch (error) {
			console.error('Error marking feedbacks as noted:', error);
		}
	}
</script>

<div class="flex h-screen min-w-0 flex-col">
	<section class="flex justify-center bg-white pt-4">
		<SearchFilters type="full" bind:filters />
	</section>

	<section class="flex min-h-0 flex-1 flex-row items-start gap-4 pt-4">
		<div
			class="flex h-[30rem] flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="h-full w-full flex-1">
				<WordCloud query={keywordCloudQuery} onNodeClick={handleNodeClick} />
			</div>
		</div>

		{#if listFeedback !== null}
			<div
				class="relative flex h-[30rem] flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="absolute top-2 right-2 z-10">
					<Button class="p-1" color="light" size="sm" onclick={() => resetSelectedKeyword()}>
						<CloseOutline size="md" />
					</Button>
				</div>

				<div class="absolute top-3 left-3 z-10 flex items-start gap-1">
					<Checkbox
						checked={isAllSelected}
						indeterminate={isIndeterminate}
						onchange={handleSelectAll}
					/>
					{#if selectedFeedbackIds.length > 1}
						<Button size="sm" class="px-2 py-1" onclick={() => summarizeSelectedFeedback()}>
							<WandMagicSparklesOutline size="sm" />
							<span class="ml-1 text-sm">Summarize {selectedFeedbackIds.length}</span>
							{#if loadSummary}
								<Spinner class="ml-1" size="4" />
							{/if}
						</Button>
					{/if}
				</div>

				<div class="mt-8 flex flex-1 flex-col gap-2 overflow-y-auto">
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
									date={feedback._creationTime}
									votes={feedback.votes}
									content={feedback.content}
									keywords={feedback.keywords ?? []}
									status={feedback.status ?? 'open'}
									sentiment={feedback.sentiment ?? 'neutral'}
									selectedIds={selectedFeedbackIds}
									onSelectionChange={handleSelectionChange}
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

	{#if showSummaryModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<Card class="relative w-full max-w-6xl rounded-2xl p-2 shadow-md">
				<div class="mb-2 flex justify-end">
					<Button color="light" class="p-1" size="sm" onclick={() => closeSummaryModal()}>
						<CloseOutline size="sm" />
					</Button>
				</div>
				<div
					class="mb-2 max-h-[36rem] overflow-y-auto rounded-2xl border border-gray-300 p-2 text-gray-900"
				>
					{@html summaryText}
				</div>
				<div class="flex justify-end">
					<Button size="sm" onclick={() => markAsNoted()}>
						<CheckOutline size="md" />
						<span class="ml-1 text-sm">Mark as {selectedFeedbackIds.length} Noted</span>
					</Button>
				</div>
			</Card>
		</div>
	{/if}
</div>
