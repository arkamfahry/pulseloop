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
	}

	const client = useConvexClient();

	async function approveFeedback() {
		try {
			await client.mutation(api.feedback.approveFeedback, { feedbackId: props.id });
		} catch (error) {
			console.error('Error approving feedback:', error);
		}
	}

	async function deleteFeedback() {
		try {
			await client.mutation(api.feedback.deleteFeedback, { feedbackId: props.id });
		} catch (error) {
			console.error('Error deleting feedback:', error);
		}
	}

	let props: Props = $props();
</script>

<Card class="relative mx-auto max-w-7xl rounded-2xl border border-gray-200 p-4 shadow-sm">
	<div class="flex w-full flex-col">
		<div class="mb-2 flex w-full items-start justify-between gap-2">
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
				<Button color="light" size="sm" class="p-1" onclick={() => deleteFeedback()}>
					<TrashBinOutline size="md" />
				</Button>
				<Button color="light" size="sm" class="p-1" onclick={() => approveFeedback()}>
					<CheckOutline size="md" />
				</Button>
			</div>
		</div>
		<div class="mb-2 flex w-full items-start justify-between gap-2">
			<p class="text-base leading-relaxed text-gray-900">
				{props.content}
			</p>
		</div>
	</div>
</Card>
