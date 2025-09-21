<script lang="ts">
	import { Button, Card, Checkbox, Search } from 'flowbite-svelte';
	import { CaretDownOutline, CaretUpOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';

	interface Filters {
		content: string;
		sentiment: 'positive' | 'negative' | 'neutral' | undefined;
		status: 'open' | 'noted' | undefined;
		myFeedback: boolean;
		votes: 'asc' | 'desc' | undefined;
	}

	interface Props {
		hidden: boolean;
		filters: Filters;
	}

	let { hidden, filters }: Props = $props();

	function updateSentiment(sentiment: 'positive' | 'negative' | 'neutral') {
		filters.sentiment = filters.sentiment === sentiment ? undefined : sentiment;
	}

	function updateStatus(status: 'open' | 'noted') {
		filters.status = filters.status === status ? undefined : status;
	}

	function updateVotes() {
		filters.votes = filters.votes === 'asc' ? 'desc' : 'asc';
	}
</script>

{#if !hidden}
	<div class="fixed inset-0 z-20 flex items-start justify-center pt-15" transition:fade>
		<Card class="mx-1 w-full max-w-3xl rounded-xl p-4 shadow-lg">
			<Search size="md" placeholder="Search..." bind:value={filters.content} clearable />

			<div class="mt-4 flex flex-wrap justify-between gap-4 p-1">
				<div>
					<div class="mb-2 font-semibold">Sentiment</div>
					<div class="mb-2 flex gap-2">
						<Button
							color="red"
							outline={filters.sentiment !== 'negative'}
							size="xs"
							class="p-1"
							onclick={() => updateSentiment('negative')}
						>
							Negative
						</Button>
						<Button
							color="blue"
							outline={filters.sentiment !== 'neutral'}
							size="xs"
							class="p-1"
							onclick={() => updateSentiment('neutral')}
						>
							Neutral
						</Button>
						<Button
							color="green"
							outline={filters.sentiment !== 'positive'}
							size="xs"
							class="p-1"
							onclick={() => updateSentiment('positive')}
						>
							Positive
						</Button>
					</div>

					<div class="mb-2 font-semibold">Status</div>
					<div class="mb-2 flex gap-2">
						<Button
							color="red"
							outline={filters.status !== 'open'}
							size="xs"
							class="p-1"
							onclick={() => updateStatus('open')}
						>
							Open
						</Button>
						<Button
							color="green"
							outline={filters.status !== 'noted'}
							size="xs"
							class="p-1"
							onclick={() => updateStatus('noted')}
						>
							Noted
						</Button>
					</div>
				</div>

				<div class="flex flex-col items-end gap-2">
					<div class="mt-7 flex gap-2">
						<Button size="xs" outline onclick={() => updateVotes()}>
							{#if filters.votes === 'asc'}
								<CaretUpOutline /> Votes
							{:else}
								<CaretDownOutline /> Votes
							{/if}
						</Button>
					</div>
					<div class="mt-6 flex gap-2">
						<Checkbox bind:checked={filters.myFeedback}>My Feedback</Checkbox>
					</div>
				</div>
			</div>
		</Card>
	</div>
{/if}
