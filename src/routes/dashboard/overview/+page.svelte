<script lang="ts">
	import { api } from '$convex/_generated/api';
	import TopFeedbackList from '$lib/dashboard/TopFeedbackList.svelte';
	import SentimentDistributionChart from '$lib/kpi/SentimentDistributionChart.svelte';
	import SentimentTrendCard from '$lib/kpi/SentimentTrendCard.svelte';
	import TrendCard from '$lib/kpi/TrendCard.svelte';
	import TrendChart from '$lib/kpi/WordCloudTrendChart.svelte';
	import '@xyflow/svelte/dist/style.css';
	import { useQuery } from 'convex-svelte';

	const totalFeedbackCountQuery = useQuery(api.feedback.getTotalFeedbackCount, {});
	const openFeedbackCountQuery = useQuery(api.feedback.getOpenFeedbackCount, {});
	const overallSentimentQuery = useQuery(api.sentiment.getOverallSentiment, {});
	const sentimentCountsQuery = useQuery(api.sentiment.getSentimentsCounts, {});
	const keywordCloudQuery = useQuery(api.keyword.getKeywordCloud, { status: 'open' });
	const topFeedbackQuery = useQuery(api.feedback.getTopFeedback, {});
</script>

<main class="flex min-w-0 flex-col gap-6">
	<section class="grid grid-cols-3 gap-6">
		<TrendCard heading="Total Feedback" query={totalFeedbackCountQuery} />
		<TrendCard heading="Open Feedback" query={openFeedbackCountQuery} />
		<SentimentTrendCard heading="Overall Sentiment" query={overallSentimentQuery} />
	</section>

	<section class="grid grid-cols-10 gap-6">
		<div
			class="col-span-4 flex min-h-48 flex-col justify-start rounded-2xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mb-3 text-lg font-semibold">Sentiment</div>
			<SentimentDistributionChart query={sentimentCountsQuery} />
		</div>
		<div
			class="col-span-6 flex min-h-48 flex-col justify-start rounded-2xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mb-3 text-lg font-semibold">Trends</div>
			<TrendChart query={keywordCloudQuery} />
		</div>
	</section>

	<section
		class="flex min-h-40 flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="mb-3 text-lg font-semibold">Top Feedback</div>
		<TopFeedbackList query={topFeedbackQuery} />
	</section>
</main>
