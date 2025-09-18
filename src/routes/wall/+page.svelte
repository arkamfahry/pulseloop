<script lang="ts">
	import type { PageProps } from './$types';
	import {
		Navbar,
		NavBrand,
		Button,
		Search,
		ToolbarButton,
		Card,
		Checkbox,
		Input,
		Label,
		Dropdown,
		DropdownHeader,
		Spinner
	} from 'flowbite-svelte';
	import {
		CaretUpOutline,
		PaperPlaneOutline,
		SearchOutline,
		ArrowRightToBracketOutline,
		AlignJustifyOutline
	} from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';
	import logo from '$lib/assets/favicon.svg';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import WallCard from '$lib/WallCard.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	const isAuthenticated = $derived(useAuth().isAuthenticated);

	async function signOut() {
		try {
			await authClient.signOut();
			goto('/');
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}

	let { data }: PageProps = $props();

	let hidden = $state(true);

	function toggle() {
		hidden = !hidden;
	}

	const publishedFeedbackQuery = useQuery(api.feedback.listPublishedFeedback, {});
</script>

<div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
	<header class="sticky top-0 left-0 z-30 w-full bg-white shadow dark:bg-gray-900">
		<Navbar>
			<NavBrand href="/">
				<img src={logo} class="mr-3 h-9 w-9" alt="PulseLoop" />
				<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
					>PulseLoop</span
				>
			</NavBrand>
			<div class="flex space-y-1 md:order-2">
				<ToolbarButton class="block" onclick={toggle}>
					<SearchOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" />
				</ToolbarButton>
				<ToolbarButton id="menu" class="block">
					<AlignJustifyOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" />
				</ToolbarButton>
				<Dropdown placement="bottom" triggeredBy="#menu">
					<DropdownHeader>
						<span class="block text-sm">Test</span>
						<span class="block truncate text-sm font-medium">test@gmail.com</span>
					</DropdownHeader>
					<DropdownHeader>
						{#if isAuthenticated}
							<Button onclick={() => signOut()}>Sign out</Button>
						{/if}
					</DropdownHeader>
				</Dropdown>
			</div>
		</Navbar>
	</header>

	{#if !hidden}
		<div class="fixed inset-0 z-20 flex items-start justify-center pt-15" transition:fade>
			<Card class="mx-1 w-full max-w-3xl rounded-xl p-4 shadow-lg">
				<Search size="md" placeholder="Search..." />

				<div class="mt-4 flex flex-wrap justify-between gap-4 p-1">
					<div>
						<div class="mb-2 font-semibold">Sentiment</div>
						<div class="mb-2 flex gap-2">
							<Button color="red" outline size="xs" class="p-1">Negative</Button>
							<Button color="blue" outline size="xs" class="p-1">Neutral</Button>
							<Button color="green" outline size="xs" class="p-1">Positive</Button>
						</div>

						<div class="mb-2 font-semibold">Status</div>
						<div class="mb-2 flex gap-2">
							<Button color="red" outline size="xs" class="p-1">Open</Button>
							<Button color="green" outline size="xs" class="p-1">Noted</Button>
						</div>
					</div>

					<div class="flex flex-col items-end gap-2">
						<div class="mt-7 flex gap-2">
							<Button size="xs" outline>
								<CaretUpOutline /> Vote
							</Button>
						</div>
						<div class="mt-6 flex gap-2">
							<Checkbox>My Feedback</Checkbox>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}

	<main class="flex flex-1 flex-col items-center px-1 py-2 md:py-4">
		<div class="w-full max-w-3xl space-y-1">
			{#if publishedFeedbackQuery.isLoading}
				<div class="flex h-screen items-center justify-center">
					<Spinner />
				</div>
			{:else if publishedFeedbackQuery.error}
				<p>Error: {publishedFeedbackQuery.error.message}</p>
			{:else}
				{#each publishedFeedbackQuery.data as feedback}
					<WallCard
						userName={feedback.user?.name ?? 'Anonymous'}
						date={new Date(feedback.createdAt).toLocaleDateString(undefined, {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
						content={feedback.content ?? ''}
						keywords={feedback.keywords ?? []}
						status={feedback.status ?? 'open'}
						sentiment={feedback.sentiment ?? 'neutral'}
						votes={feedback.votes ?? 0}
					/>
				{/each}
			{/if}
		</div>
	</main>

	<footer
		class="sticky bottom-0 left-0 z-50 w-full border-t border-gray-300 bg-white px-2 py-2 dark:bg-gray-900"
	>
		<form class="mx-auto flex max-w-3xl items-center gap-2">
			<Label for="content" class="hidden">Your message</Label>
			<Input
				class="flex-1 rounded-lg border px-3 py-2 focus:outline-none"
				type="text"
				id="content"
				placeholder="Share Your Thoughts..."
				required
			/>

			<Button outline size="sm" class="px-2">
				<PaperPlaneOutline class="rotate-90" />
			</Button>
		</form>
	</footer>
</div>
