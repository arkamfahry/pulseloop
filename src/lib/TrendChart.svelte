<script lang="ts">
	import { Card, Spinner } from 'flowbite-svelte';
	import { SvelteFlow, Controls } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import CustomNode from '$lib/CustomNode.svelte';

	const nodeTypes = {
		custom: CustomNode
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

<div style:width="100vw" style:height="40vh">
	<SvelteFlow bind:nodes {nodeTypes}>
		<Controls />
	</SvelteFlow>
</div>
