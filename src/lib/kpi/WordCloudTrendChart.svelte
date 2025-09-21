<script lang="ts">
	import type { api } from '$convex/_generated/api';
	import type { FunctionReturnType } from 'convex/server';

	import WordCloudNode from '$lib/WordCloudNode.svelte';
	import { Controls, SvelteFlow } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import { Spinner } from 'flowbite-svelte';

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

	let placedNodes: Array<{ x: number; y: number; radius: number }> = [];

	function getNodeRadius(count: number, maxCount: number): number {
		const minRadius = 25; // Reduced from 30
		const maxRadius = 70; // Reduced from 80
		const normalizedSize = count / maxCount;
		return minRadius + (maxRadius - minRadius) * normalizedSize;
	}

	function checkCollision(x: number, y: number, radius: number): boolean {
		return placedNodes.some((node) => {
			const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
			// Increased spacing from 2 to 5 for a bit more breathing room
			return distance < radius + node.radius + 5;
		});
	}

	function generateSpiralPosition(
		keyword: { count: number },
		index: number,
		sortedKeywords: Array<{ count: number }>,
		centerX = 400,
		centerY = 300
	) {
		const maxCount = sortedKeywords[0]?.count || 1;
		const nodeRadius = getNodeRadius(keyword.count, maxCount);

		if (index === 0) {
			placedNodes = [{ x: centerX, y: centerY, radius: nodeRadius }];
			return { x: centerX, y: centerY };
		}

		// Start closer to center and use slightly larger increments for more spacing
		let radius = 35; // Increased from 30
		let angle = 0;
		let spiralStep = 0.4; // Increased from 0.3 for slightly looser spiral
		let radiusStep = 5; // Increased from 4 for slightly larger radius increments
		let maxAttempts = 1000; // Add attempt limit to prevent infinite loops
		let attempts = 0;

		while (radius < 400 && attempts < maxAttempts) {
			const x = centerX + Math.cos(angle) * radius;
			const y = centerY + Math.sin(angle) * radius;

			if (!checkCollision(x, y, nodeRadius)) {
				placedNodes.push({ x, y, radius: nodeRadius });
				return { x, y };
			}

			angle += spiralStep;
			// Slightly more gradual radius increase with a bit more spacing
			radius += (radiusStep * spiralStep) / (3.5 * Math.PI); // Changed divisor from 4π to 3.5π
			attempts++;
		}

		// Tighter fallback positioning
		const fallbackX = centerX + (Math.random() - 0.5) * 100; // Reduced from 200
		const fallbackY = centerY + (Math.random() - 0.5) * 100; // Reduced from 200
		placedNodes.push({ x: fallbackX, y: fallbackY, radius: nodeRadius });
		return { x: fallbackX, y: fallbackY };
	}

	let nodes = $derived.by(() => {
		placedNodes = [];

		if (!props.query.data) {
			return [
				{
					id: '1',
					type: 'custom' as const,
					position: { x: 400, y: 300 },
					data: { keyword: 'No Keywords Available', sentiment: 'neutral', count: 5 }
				}
			];
		}

		const keywordEntries = Object.entries(props.query.data);

		const sortedKeywords = keywordEntries
			.map(([key, keyword]) => ({ key, ...keyword }))
			.sort((a, b) => b.count - a.count);

		return sortedKeywords.map((keyword, index) => ({
			id: keyword.id,
			type: 'custom' as const,
			position: generateSpiralPosition(keyword, index, sortedKeywords),
			data: {
				keyword: keyword.name,
				sentiment: keyword.sentiment,
				count: keyword.count
			},
			zIndex: 1000 + keyword.count
		}));
	});
</script>

{#if props.query.isLoading}
	<div class="flex h-full flex-1 items-center justify-center">
		<Spinner />
	</div>
{:else if props.query.error}
	<div class="flex h-64 items-center justify-center">
		<div class="text-red-500">Error loading keywords: {props.query.error.message}</div>
	</div>
{:else}
	<div style="height: 100%; width: 100%;">
		<SvelteFlow {nodes} {nodeTypes} fitView={true} minZoom={0.5} maxZoom={2}>
			<Controls />
		</SvelteFlow>
	</div>
{/if}
