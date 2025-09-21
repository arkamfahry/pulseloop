<script lang="ts">
	import type { Id } from '$convex/_generated/dataModel';
	import { Badge, Button, Card, Checkbox } from 'flowbite-svelte';
	import { CaretUpOutline, CheckOutline, TrashBinOutline } from 'flowbite-svelte-icons';

	interface Props {
		id: Id<'feedbacks'>;
		userName: string;
		date: number;
		votes: number;
		content: string;
		keywords: string[];
		status: 'open' | 'noted';
		sentiment: 'positive' | 'neutral' | 'negative';
	}

	let props: Props = $props();

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

<Card class="relative mx-auto max-w-6xl rounded-2xl border border-gray-200 p-4 shadow-sm">
	<div class="flex w-full flex-col">
		<div class="mb-4 flex w-full items-start justify-between gap-2">
			<div class="flex items-center gap-2">
				<Checkbox />
				<span class="truncate text-sm font-semibold text-gray-900">{props.userName}</span>
				<span class="px-1 text-sm text-gray-500"
					>{new Date(props.date).toLocaleDateString(undefined, {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})}</span
				>
				<span
					class="flex items-center gap-1 rounded-lg border border-none bg-white px-2 py-0.5 text-sm font-medium text-gray-600"
				>
					<CaretUpOutline class="h-4 w-4 text-gray-600" />
					<span>{props.votes}</span>
				</span>
			</div>
			<div class="flex items-center gap-2">
				<Button color="light" size="sm" class="p-1">
					<TrashBinOutline size="md" class="text-gray-500 group-hover:text-gray-900" />
				</Button>
				<Button color="light" size="sm" class="p-1">
					<CheckOutline size="md" class="text-gray-500 group-hover:text-gray-900" />
				</Button>
			</div>
		</div>
		<p class="mb-4 text-base leading-relaxed text-gray-900">
			{props.content}
		</p>
		<div class="mt-4 flex flex-wrap items-center justify-between gap-2">
			<div class="flex flex-wrap gap-2">
				{#each props.keywords as keyword}
					<Badge
						color="gray"
						class="rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium break-words text-gray-700"
						>{keyword}</Badge
					>
				{/each}
			</div>
			<Badge
				color={getSentimentColor(props.sentiment)}
				class="ml-2 rounded-md border px-3 py-1 text-xs font-medium"
			>
				{props.sentiment.charAt(0).toUpperCase() + props.sentiment.slice(1)}
			</Badge>
		</div>
	</div>
</Card>
