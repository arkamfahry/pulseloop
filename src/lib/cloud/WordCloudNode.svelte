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

	let nodeSize = $derived(() => {
		const count = (data.count as number) || 1;

		const minSize = 0.8;
		const maxSize = 2.5;

		const assumedMaxCount = 20;

		const normalizedCount = Math.min(count / assumedMaxCount, 1);

		const scale = minSize + normalizedCount * (maxSize - minSize);

		return {
			scale,
			fontSize: Math.max(12, 16 * scale),
			padding: {
				x: Math.max(12, 24 * scale),
				y: Math.max(6, 8 * scale)
			}
		};
	});

	let dynamicClasses = $derived(() => {
		const size = nodeSize();

		let fontSizeClass = 'text-sm';
		if (size.fontSize >= 32) fontSizeClass = 'text-3xl';
		else if (size.fontSize >= 28) fontSizeClass = 'text-2xl';
		else if (size.fontSize >= 24) fontSizeClass = 'text-xl';
		else if (size.fontSize >= 20) fontSizeClass = 'text-lg';
		else if (size.fontSize >= 16) fontSizeClass = 'text-base';

		let paddingClass = 'px-4 py-2';
		if (size.padding.x >= 40) paddingClass = 'px-10 py-4';
		else if (size.padding.x >= 32) paddingClass = 'px-8 py-3';
		else if (size.padding.x >= 24) paddingClass = 'px-6 py-2';
		else if (size.padding.x >= 16) paddingClass = 'px-4 py-2';
		else paddingClass = 'px-3 py-1';

		return {
			fontSizeClass,
			paddingClass
		};
	});
</script>

<div
	class={`flex items-center justify-center rounded-xl border-2 shadow-sm transition-all duration-300 hover:shadow-lg ${bgClass} ${borderClass} ${dynamicClasses().paddingClass}`}
	style="transform: scale({nodeSize().scale}); transform-origin: center;"
>
	<button>
		<span class={`font-semibold ${textClass} ${dynamicClasses().fontSizeClass}`}>
			{data.keyword}
		</span>
	</button>
	{#if (data.count as number) > 1}
		<span
			class={`ml-2 rounded-full px-2 py-0.5 text-xs ${bgClass} ${borderClass} border opacity-75`}
		>
			{data.count}
		</span>
	{/if}
</div>
