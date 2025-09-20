<script lang="ts">
	import { api } from '$convex/_generated/api';
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
	const keywordCloudQuery = useQuery(api.keyword.getKeywordCloud, {});
</script>

<main class="flex min-w-0 flex-col gap-6">
	<section class="grid grid-cols-3 gap-6">
		<TrendCard heading="Total Feedback" query={totalFeedbackCountQuery} />
		<TrendCard heading="Open Feedback" query={openFeedbackCountQuery} />
		<SentimentTrendCard heading="Overall Sentiment" query={overallSentimentQuery} />
	</section>

	<section class="grid grid-cols-10 gap-6">
		<div class="col-span-4 flex min-h-48 flex-col justify-start rounded-2xl bg-white p-8 shadow-sm">
			<div class="mb-3 text-lg font-semibold">Sentiment</div>
			<SentimentDistributionChart query={sentimentCountsQuery} />
		</div>
		<div class="col-span-6 flex min-h-48 flex-col justify-start rounded-2xl bg-white p-8 shadow-sm">
			<div class="mb-3 text-lg font-semibold">Trends</div>
			<div class="flex flex-wrap gap-2.5">
				<TrendChart query={keywordCloudQuery} />
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
