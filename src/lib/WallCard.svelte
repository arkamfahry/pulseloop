<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import { CaretUpOutline } from 'flowbite-svelte-icons';

	interface Props {
		userName: string;
		date: string;
		votes: number;
		content: string;
		keywords: string[];
		status: 'open' | 'noted';
		sentiment: 'positive' | 'neutral' | 'negative';
	}

	let props: Props = $props();

	function getStatusColor(status: string) {
		return status === 'open' ? 'red' : 'green';
	}

	function getSentimentColor(sentiment: string) {
		switch (sentiment) {
			case 'positive':
				return 'green';
			case 'negative':
				return 'red';
			case 'neutral':
			default:
				return 'blue';
		}
	}
</script>

<Card
	class="relative mx-auto max-w-3xl rounded-2xl border border-gray-200 p-4 shadow dark:border-gray-700"
>
	<div class="grid min-h-[120px] grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr_auto] gap-y-2">
		<div class="col-start-1 row-start-1 flex items-center gap-2">
			<span class="font-semibold text-gray-900 dark:text-white">{props.userName}</span>
			<span class="text-sm text-gray-500 dark:text-gray-400">{props.date}</span>
		</div>
		<div class="col-start-2 row-start-1 flex items-center justify-end">
			<Button
				class="flex items-center space-x-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 dark:bg-gray-800"
				style="box-shadow: none;"
				type="button"
				aria-label="Votes"
			>
				<CaretUpOutline class="h-4 w-4 text-gray-400" />
				<span class="text-sm font-medium text-gray-600 dark:text-gray-400">{props.votes}</span>
			</Button>
		</div>

		<div class="col-span-2 row-start-2">
			<p class="mb-2 text-base leading-relaxed text-gray-900 dark:text-gray-300">
				{props.content}
			</p>
		</div>

		<div class="col-span-2 row-start-3">
			<div class="flex w-full items-center gap-2">
				<div class="flex min-w-0 flex-grow flex-wrap gap-2">
					{#each props.keywords as keyword}
						<Badge
							color="gray"
							class="rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium break-words text-gray-700"
							>{keyword}</Badge
						>
					{/each}
				</div>
				<div class="ml-2 flex flex-shrink-0 flex-row gap-2">
					<Badge
						color={getSentimentColor(props.sentiment)}
						class="rounded-md border px-3 py-1 text-xs font-medium"
					>
						{props.sentiment.charAt(0).toUpperCase() + props.sentiment.slice(1)}
					</Badge>
					<Badge
						color={getStatusColor(props.status)}
						class="rounded-md border px-3 py-1 text-xs font-medium"
					>
						{props.status.charAt(0).toUpperCase() + props.status.slice(1)}
					</Badge>
				</div>
			</div>
		</div>
	</div>
</Card>
