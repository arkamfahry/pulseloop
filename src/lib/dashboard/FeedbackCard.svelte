<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { useConvexClient } from 'convex-svelte';
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
		selectedIds?: Id<'feedbacks'>[];
		onSelectionChange?: (id: Id<'feedbacks'>, checked: boolean) => void;
	}

	const client = useConvexClient();

	let { selectedIds, onSelectionChange, ...props }: Props = $props();

	const isSelected = $derived.by(() => selectedIds?.includes(props.id));

	async function toggleFeedbackStatus() {
		try {
			await client.mutation(api.feedback.toggleFeedbackStatus, { feedbackId: props.id });
		} catch (error) {
			console.error('Error toggling feedback status:', error);
		}
	}

	async function deleteFeedback() {
		try {
			await client.mutation(api.feedback.deleteFeedback, { feedbackId: props.id });
		} catch (error) {
			console.error('Error deleting feedback:', error);
		}
	}

	function handleCheckboxChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onSelectionChange?.(props.id, target.checked);
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

	function getStatusColor(status: string) {
		switch (status) {
			case 'open':
				return 'light';
			case 'noted':
				return 'green';
			default:
				return 'light';
		}
	}
</script>

<Card class="relative mx-auto max-w-7xl rounded-2xl border border-gray-200 p-4 shadow-sm">
	<div class="flex w-full flex-col">
		<div class="mb-2 flex w-full items-start justify-between gap-2">
			<div class="flex items-center gap-2">
				<Checkbox checked={isSelected} onchange={handleCheckboxChange} />
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
				<Button color="light" size="sm" class="p-1" onclick={() => deleteFeedback()}>
					<TrashBinOutline size="md" />
				</Button>
				<Button
					color={getStatusColor(props.status)}
					size="sm"
					class="p-1"
					onclick={() => toggleFeedbackStatus()}
				>
					<CheckOutline size="md" />
				</Button>
			</div>
		</div>
		<div class="mb-4 flex w-full items-start justify-between gap-2">
			<p class="text-base leading-relaxed text-gray-900">
				{props.content}
			</p>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2">
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
