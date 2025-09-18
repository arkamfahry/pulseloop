<script lang="ts">
	import type { SentimentCounts } from '$convex/sentiment';
	import { Spinner } from 'flowbite-svelte';
	import { PieChart } from 'layerchart';

	interface Props {
		isLoading: boolean;
		data: SentimentCounts | null | undefined;
		error?: Error | null;
	}

	let props: Props = $props();
</script>

<div class="h-72 overflow-auto rounded-sm">
	{#if props.isLoading}
		<div class="flex h-full flex-1 items-center justify-center">
			<Spinner />
		</div>
	{:else if props.error}
		<div>Error: {props.error.message}</div>
	{:else}
		<PieChart
			data={props.data?.values ?? []}
			key="sentiment"
			value="count"
			cRange={['var(--color-success)', 'var(--color-danger)', 'var(--color-info)']}
			innerRadius={-40}
			cornerRadius={5}
			padAngle={0.02}
			padding={{ right: 48 }}
			legend={{ placement: 'right', orientation: 'vertical' }}
			renderContext="canvas"
		/>
	{/if}
</div>
