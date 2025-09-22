<script lang="ts">
	import { Button, Card, Search } from 'flowbite-svelte';
	import { CaretDownOutline, CaretUpOutline, CloseOutline } from 'flowbite-svelte-icons';
	import { Datepicker } from 'flowbite-svelte';

	interface Filters {
		content: string;
		sentiment: 'positive' | 'negative' | 'neutral' | undefined;
		status: 'open' | 'noted' | undefined;
		votes: 'asc' | 'desc' | undefined;
		from?: Date | undefined;
		to?: Date | undefined;
	}

	interface Props {
		filters: Filters;
		type: 'full' | 'simple';
	}

	let { filters = $bindable(), type = 'full' }: Props = $props();

	let searchInput = $state(filters.content);
	let debounceTimer: NodeJS.Timeout;

	$effect(() => {
		searchInput;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			filters.content = searchInput;
		}, 300);
	});

	$effect(() => {
		if (filters.content === '') {
			searchInput = '';
		}
	});

	function updateSentiment(sentiment: 'positive' | 'negative' | 'neutral') {
		filters.sentiment = filters.sentiment === sentiment ? undefined : sentiment;
	}

	function updateStatus(status: 'open' | 'noted') {
		filters.status = filters.status === status ? undefined : status;
	}

	function updateVotes() {
		filters.votes = filters.votes === 'asc' ? 'desc' : 'asc';
	}

	function clearFilters() {
		searchInput = '';
		filters.content = '';
		filters.sentiment = undefined;
		filters.status = undefined;
		filters.votes = undefined;
		filters.from = undefined;
		filters.to = undefined;
	}
</script>

<Card class="mx-1 w-full max-w-7xl rounded-xl p-6 shadow-lg">
	<div class="flex flex-col gap-4">
		<Search
			size="md"
			placeholder="Search..."
			bind:value={searchInput}
			clearable
			class="rounded-lg bg-gray-50"
		/>
		<div class="flex w-full flex-row flex-wrap items-start gap-1">
			<div class="flex min-w-[180px] flex-1 flex-col gap-2">
				{#if type === 'full'}
					<div>
						<div class="mb-2 font-semibold">Sentiment</div>
						<div class="flex gap-2">
							<Button
								color="red"
								outline={filters.sentiment !== 'negative'}
								size="xs"
								class="p-1"
								onclick={() => updateSentiment('negative')}>Negative</Button
							>
							<Button
								color="blue"
								outline={filters.sentiment !== 'neutral'}
								size="xs"
								class="p-1"
								onclick={() => updateSentiment('neutral')}>Neutral</Button
							>
							<Button
								color="green"
								outline={filters.sentiment !== 'positive'}
								size="xs"
								class="p-1"
								onclick={() => updateSentiment('positive')}>Positive</Button
							>
						</div>
					</div>
					<div>
						<div class="mb-2 font-semibold">Status</div>
						<div class="flex gap-2">
							<Button
								color="red"
								outline={filters.status !== 'open'}
								size="xs"
								class="p-1"
								onclick={() => updateStatus('open')}>Open</Button
							>
							<Button
								color="green"
								outline={filters.status !== 'noted'}
								size="xs"
								class="p-1"
								onclick={() => updateStatus('noted')}>Noted</Button
							>
						</div>
					</div>
				{/if}
			</div>
			<div class="flex min-w-[220px] flex-col items-end justify-end gap-2 sm:w-auto">
				<div class="flex w-full flex-col gap-2 sm:flex-row sm:gap-3">
					<div class="flex w-full flex-col items-start sm:w-auto sm:max-w-xs">
						<label class="mb-1 font-semibold" for="from-date">From</label>
						<Datepicker
							id="from-date"
							bind:value={filters.from}
							placeholder="From"
							class="w-full sm:max-w-xs"
						/>
					</div>
					<div class="flex w-full flex-col items-start sm:w-auto sm:max-w-xs">
						<label class="mb-1 font-semibold" for="to-date">To</label>
						<Datepicker
							id="to-date"
							bind:value={filters.to}
							placeholder="To"
							class="w-full sm:max-w-xs"
						/>
					</div>
				</div>
				{#if type === 'full'}
					<div class="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Button size="xs" color="light" class="w-full sm:w-auto" onclick={() => updateVotes()}>
							{#if filters.votes === 'asc'}
								<CaretDownOutline /> Vote
							{:else}
								<CaretUpOutline /> Vote
							{/if}
						</Button>
						<Button size="xs" color="light" class="w-full sm:w-auto" onclick={() => clearFilters()}>
							<CloseOutline /> Clear
						</Button>
					</div>
				{:else}
					<div class="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Button size="xs" color="light" class="w-full sm:w-auto" onclick={() => clearFilters()}>
							<CloseOutline /> Clear
						</Button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</Card>
