<script lang="ts">
	import { Card, Spinner } from 'flowbite-svelte';
	export let isLoading: boolean;
	export let heading: string;
	export let content: number | null | undefined;
</script>

<Card class="flex min-h-24 flex-col justify-center gap-1.5 rounded-2xl p-6 text-lg shadow-sm">
	{#if isLoading}
		<div class="flex h-full flex-1 items-center justify-center">
			<Spinner />
		</div>
	{:else}
		<span class="text-2xl font-medium text-gray-500">{heading}</span>
		<span class="mt-1 text-4xl font-bold text-gray-900">
			{content != null ? content : '0'}
		</span>
	{/if}
</Card>
