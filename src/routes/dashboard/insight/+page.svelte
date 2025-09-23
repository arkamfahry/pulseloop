<script lang="ts">
	import { api } from '$convex/_generated/api';
	import SearchFilters from '$lib/dashboard/SearchFilters.svelte';
	import { useQuery } from 'convex-svelte';
	import WordCloud from '$lib/cloud/WordCloud.svelte';

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
</script>

<main class="flex h-screen min-w-0 flex-col">
	<section class="flex justify-center bg-white">
		<SearchFilters type="full" bind:filters />
	</section>

	<section class="flex min-h-0 flex-1 flex-col items-center gap-4 px-1 pt-4">
		<div
			class="flex h-[30rem] w-full max-w-7xl flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="h-full w-full flex-1">
				<WordCloud query={keywordCloudQuery} />
			</div>
		</div>
	</section>
</main>
