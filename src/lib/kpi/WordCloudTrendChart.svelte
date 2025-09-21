<script lang="ts">
	import type { api } from '$convex/_generated/api';
	import type { FunctionReturnType } from 'convex/server';

	import WordCloudNode from '$lib/WordCloudNode.svelte';
	import { Controls, SvelteFlow } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	interface Props {
		query: {
			isLoading: boolean;
			data: FunctionReturnType<typeof api.keyword.getKeywordCloud> | null | undefined;
			error?: Error | null;
		};
	}

	let props: Props = $props();

	const nodeTypes = {
		custom: WordCloudNode
	};

	let nodes = $state.raw([
		{
			id: '1',
			type: 'custom',
			position: { x: 0, y: 0 },
			data: { keyword: 'MC Exam', sentiment: 'negative' }
		},
		{
			id: '2',
			type: 'custom',
			position: { x: 100, y: 100 },
			data: { keyword: 'Hackathon', sentiment: 'positive' }
		},
		{
			id: '3',
			type: 'custom',
			position: { x: 200, y: 200 },
			data: { keyword: 'ECS Exam', sentiment: 'neutral' }
		}
	]);
</script>

<div class="flex flex-wrap gap-2.5">
	<div style:width="100vw" style:height="40vh">
		<SvelteFlow bind:nodes {nodeTypes}>
			<Controls />
		</SvelteFlow>
	</div>
</div>
