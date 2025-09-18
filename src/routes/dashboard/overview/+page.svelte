<script lang="ts">
	import TrendCard from '$lib/TrendCard.svelte';
	import SentimentTrendCard from '$lib/SentimentTrendCard.svelte';
	import { Spinner } from 'flowbite-svelte';
	import { PieChart } from 'layerchart';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import SentimentPieChart from '$lib/SentimentPieChart.svelte';

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
				<span class="rounded-xl bg-gray-100 px-6 py-2 text-base font-medium text-red-700"
					>Cafeteria</span
				>
				<span class="rounded-xl bg-gray-100 px-6 py-2 text-base font-medium text-red-700"
					>Learning Portal</span
				>
				<span class="rounded-xl bg-gray-100 px-6 py-2 text-base font-medium text-red-700"
					>MC Exam</span
				>
				<span class="rounded-xl bg-gray-100 px-6 py-2 text-base font-medium text-red-700"
					>ECS Course</span
				>
				<span class="rounded-xl bg-emerald-50 px-6 py-2 text-base font-medium text-emerald-600"
					>Hackathon</span
				>
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
