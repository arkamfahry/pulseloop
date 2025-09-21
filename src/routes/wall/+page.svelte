<!-- +page.svelte (Refactored) -->
<script lang="ts">
	import type { PageProps } from './$types';
	import { api } from '$convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	import Header from '$lib/wall/Header.svelte';
	import SearchFilters from '$lib/wall/SearchFilters.svelte';
	import FeedbackList from '$lib/wall/FeedbackList.svelte';
	import FeedbackForm from '$lib/wall/FeedbackForm.svelte';

	let { data }: PageProps = $props();

	let hidden = $state(true);

	function toggleSearch() {
		hidden = !hidden;
	}

	let filters = $state({
		content: '',
		sentiment: undefined as 'positive' | 'negative' | 'neutral' | undefined,
		status: undefined as 'open' | 'noted' | undefined,
		myFeedback: false,
		votes: undefined as 'asc' | 'desc' | undefined
	});

	let debouncedContent = $state('');
	let debounceTimeout: ReturnType<typeof setTimeout>;

	$effect(() => {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			debouncedContent = filters.content;
		}, 500);
		return () => {
			clearTimeout(debounceTimeout);
		};
	});

	const publishedFeedbackQuery = useQuery(api.feedback.listPublishedFeedback, () => ({
		content: debouncedContent,
		sentiment: filters.sentiment,
		status: filters.status,
		myFeedback: filters.myFeedback,
		votes: filters.votes
	}));
</script>

<div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
	<Header onSearchToggle={toggleSearch} />

	<SearchFilters {hidden} {filters} />

	<FeedbackList query={publishedFeedbackQuery} />

	<FeedbackForm />
</div>
