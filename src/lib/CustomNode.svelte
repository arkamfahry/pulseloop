<script lang="ts">
	import { type NodeProps } from '@xyflow/svelte';

	let { data }: NodeProps = $props();

	let bgClass = $state('');
	let borderClass = $state('');
	let textClass = $state('');

	if (data.sentiment === 'positive') {
		bgClass = 'bg-green-50';
		borderClass = 'border-green-300';
		textClass = 'text-green-800';
	} else if (data.sentiment === 'negative') {
		bgClass = 'bg-red-50';
		borderClass = 'border-red-300';
		textClass = 'text-red-800';
	} else {
		bgClass = 'bg-blue-50';
		borderClass = 'border-blue-300';
		textClass = 'text-blue-800';
	}
</script>

<div
	class={`flex items-center justify-center rounded-xl border-2 px-6 py-2 shadow-sm ${bgClass} ${borderClass}`}
>
	<span class={`text-xl font-semibold ${textClass}`}>{data.keyword}</span>
</div>
