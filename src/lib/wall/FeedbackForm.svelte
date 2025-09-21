<script lang="ts">
	import { api } from '$convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { Button, Input, Label, Spinner } from 'flowbite-svelte';
	import { PaperPlaneOutline } from 'flowbite-svelte-icons';

	const client = useConvexClient();

	let content: string = $state('');
	let error: string | null = $state(null);
	let submitting = $state(false);

	const canSubmit = $derived(content.trim().length > 0 && !submitting);

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!content.trim()) {
			return;
		}

		error = null;
		submitting = true;

		try {
			await client.mutation(api.feedback.submitFeedback, { content: content.trim() });
			content = '';
		} catch (err: any) {
			if (err?.message) {
				error = err.message;
			} else {
				error = 'An unexpected error occurred. Please try again';
			}
		} finally {
			submitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (canSubmit) {
				handleSubmit(e);
			}
		}
	}
</script>

<footer
	class="sticky bottom-0 left-0 z-50 w-full border-t border-gray-300 bg-white px-2 py-2 dark:bg-gray-900"
>
	<form class="mx-auto flex max-w-3xl items-center gap-2" onsubmit={handleSubmit}>
		<Label for="content" class="hidden">Your Feedback</Label>
		<Input
			class="flex-1 rounded-lg border px-3 py-2 focus:outline-none"
			id="content"
			type="text"
			placeholder="Share Your Feedback..."
			bind:value={content}
			onkeydown={handleKeydown}
		/>

		<Button outline size="sm" class="px-2" type="submit" disabled={!canSubmit}>
			{#if submitting}
				<Spinner size="4" />
			{:else}
				<PaperPlaneOutline class="rotate-90" />
			{/if}
		</Button>
	</form>

	{#if error}
		<div class="mx-auto mt-2 max-w-3xl text-center text-sm text-red-600 dark:text-red-400">
			{error}
		</div>
	{/if}
</footer>
