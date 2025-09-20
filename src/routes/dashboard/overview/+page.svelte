<script lang="ts">
	import { api } from '$convex/_generated/api';
	import CustomNode from '$lib/CustomNode.svelte';
	import SentimentPieChart from '$lib/SentimentPieChart.svelte';
	import SentimentTrendCard from '$lib/SentimentTrendCard.svelte';
	import TrendCard from '$lib/TrendCard.svelte';
	import TrendChart from '$lib/TrendChart.svelte';
	import '@xyflow/svelte/dist/style.css';
	import { useQuery } from 'convex-svelte';

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

	const nodeTypes = {
		custom: CustomNode
	};

	const totalFeedbackCountQuery = useQuery(api.feedback.getTotalFeedbackCount, {});
	const openFeedbackCountQuery = useQuery(api.feedback.getOpenFeedbackCount, {});
	const overallSentimentQuery = useQuery(api.sentiment.getOverallSentiment, {});
	const sentimentCountsQuery = useQuery(api.sentiment.getSentimentsCounts, {});
</script>

<main class="flex min-w-0 flex-col gap-6">
	<section class="grid grid-cols-3 gap-6">
		<TrendCard
			heading="Total Feedback"
			isLoading={totalFeedbackCountQuery.isLoading}
			error={totalFeedbackCountQuery.error}
			data={totalFeedbackCountQuery.data}
		/>
		<TrendCard
			heading="Open Feedback"
			isLoading={openFeedbackCountQuery.isLoading}
			error={openFeedbackCountQuery.error}
			data={openFeedbackCountQuery.data}
		/>
		<SentimentTrendCard
			heading="Overall Sentiment"
			isLoading={overallSentimentQuery.isLoading}
			error={overallSentimentQuery.error}
			data={overallSentimentQuery.data}
		/>
	</section>

	<section class="grid grid-cols-10 gap-6">
		<div class="col-span-4 flex min-h-48 flex-col justify-start rounded-2xl bg-white p-8 shadow-sm">
			<div class="mb-3 text-lg font-semibold">Sentiment</div>
			<SentimentPieChart
				data={sentimentCountsQuery.data}
				isLoading={sentimentCountsQuery.isLoading}
				error={sentimentCountsQuery.error}
			/>
		</div>
		<div class="col-span-6 flex min-h-48 flex-col justify-start rounded-2xl bg-white p-8 shadow-sm">
			<div class="mb-3 text-lg font-semibold">Trends</div>
			<div class="flex flex-wrap gap-2.5">
				<TrendChart />
			</div>
		</div>
	</section>

	<section class="flex min-h-40 flex-col rounded-2xl bg-white p-8 shadow-sm">
		<div class="mb-3 text-lg font-semibold">Top Feedback</div>
		<div class="mt-4 flex flex-col gap-4">
			<div class="rounded-xl bg-gray-50 p-6 text-base text-gray-900 shadow-sm">[Feedback 1]</div>
			<div class="rounded-xl bg-gray-50 p-6 text-base text-gray-900 shadow-sm">[Feedback 2]</div>
			<div class="rounded-xl bg-gray-50 p-6 text-base text-gray-900 shadow-sm">[Feedback 3]</div>
		</div>
	</section>
</main>
