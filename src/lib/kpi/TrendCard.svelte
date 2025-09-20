<script lang="ts">
	import { Card, Spinner } from 'flowbite-svelte';

	interface Props {
		heading: string;
		query: {
			isLoading: boolean;
			data: number | null | undefined;
			error?: Error | null;
		};
	}

	let props: Props = $props();
</script>

<Card class="flex min-h-24 flex-col justify-center gap-1.5 rounded-2xl p-6 text-lg shadow-sm">
	{#if props.query.isLoading}
		<div class="flex h-full flex-1 items-center justify-center">
			<Spinner />
		</div>
	{:else if props.query.error}
		<div class="flex h-full flex-1 items-center justify-center text-red-600">
			Error: {props.query.error.message}
		</div>
	{:else}
		<span class="text-2xl font-medium text-gray-500">{props.heading}</span>
		<span class="mt-1 text-4xl font-bold text-gray-900">
			{props.query.data != null ? props.query.data : '0'}
		</span>
	{/if}
</Card>
