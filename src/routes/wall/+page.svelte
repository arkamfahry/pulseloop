<script lang="ts">
	import type { PageProps } from './$types';
	import {
		Navbar,
		NavBrand,
		Button,
		NavUl,
		NavHamburger,
		Search,
		ToolbarButton,
		Card,
		Checkbox,
		Input
	} from 'flowbite-svelte';
	import { CaretUpOutline, PaperPlaneOutline, SearchOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';
	import logo from '$lib/assets/favicon.svg';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import WallCard from '$lib/WallCard.svelte';

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

	function clickOutside(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			if (!node.contains(event.target as Node)) {
				hidden = true;
			}
		};
		document.addEventListener('mousedown', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('mousedown', handleClick, true);
			}
		};
	}
</script>

<div class="my-15 flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
	<header class="fixed top-0 left-0 z-30 w-full bg-white shadow dark:bg-gray-900">
		<Navbar>
			<NavBrand href="/">
				<img src={logo} class="mr-3 h-9 w-9" alt="PulseLoop" />
				<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
					>PulseLoop</span
				>
			</NavBrand>
			<div class="flex md:order-2">
				<ToolbarButton class="block" onclick={toggle}>
					<SearchOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" />
				</ToolbarButton>
				<NavHamburger />
			</div>
			<NavUl>
				{#if isAuthenticated}
					<Button onclick={() => signOut()}>Sign out</Button>
				{/if}
			</NavUl>
		</Navbar>
	</header>

	{#if !hidden}
		<div class="fixed inset-0 z-20 flex items-start justify-center pt-15" transition:fade>
			<Card class="mx-1 w-full max-w-3xl rounded-xl p-4 shadow-lg">
				<Search size="md" placeholder="Search..." />

				<div class="mt-4 flex justify-between gap-4 p-1">
					<div>
						<div class="mb-2 font-semibold">Sentiment</div>
						<div class="mb-2 flex gap-2">
							<Button color="red" outline size="xs" class="p-1">Negative</Button>
							<Button color="yellow" outline size="xs" class="p-1">Neutral</Button>
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

	<main class="flex flex-1 flex-col items-center px-1 py-1">
		<div class="w-full max-w-3xl space-y-1">
			<WallCard
				userName="alice"
				date={new Date(Date.now()).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})}
				content="orem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"
				keywords={['UI', 'UX']}
				status="open"
				sentiment="positive"
				votes={0}
			/>
		</div>
	</main>

	<footer
		class="fixed bottom-0 left-0 z-50 w-full border-t border-gray-300 bg-white px-2 py-2 dark:bg-gray-900"
	>
		<form class="mx-auto flex max-w-3xl items-center gap-2">
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
