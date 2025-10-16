<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$convex/_generated/api';
	import logo from '$lib/assets/favicon.svg';
	import { authClient } from '$lib/auth-client';
	import { useQuery } from 'convex-svelte';
	import {
		Button,
		Sidebar,
		SidebarBrand,
		SidebarButton,
		SidebarGroup,
		SidebarItem,
		uiHelpers
	} from 'flowbite-svelte';
	import {
		ArrowRightToBracketOutline,
		ChartPieOutline,
		LightbulbOutline,
		MessageDotsOutline,
		PaperPlaneOutline
	} from 'flowbite-svelte-icons';

	let activeUrl = $state(page.url.pathname);
	const sidebarUi = uiHelpers();
	let isOpen = $state(false);
	const closeSidebar = sidebarUi.close;

	$effect(() => {
		isOpen = sidebarUi.isOpen;
		activeUrl = page.url.pathname;
	});

	const currentUserQuery = useQuery(api.auth.getCurrentUser, {});

	async function signOut() {
		try {
			await authClient.signOut();
			await goto('/');
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}
</script>

<SidebarButton onclick={sidebarUi.toggle} class="fixed top-4 left-4 z-50" />

<Sidebar
	{activeUrl}
	backdrop={false}
	{isOpen}
	{closeSidebar}
	position="static"
	params={{ x: -50, duration: 50 }}
	class="relative h-full w-64 border-r border-gray-300 pb-20 dark:border-gray-700"
	classes={{
		nonactive: 'p-2 text-gray-600',
		active: 'p-2 text-blue-600 font-semibold bg-gray-100 dark:bg-gray-700'
	}}
>
	<SidebarGroup>
		<SidebarBrand
			site={{ name: 'PulseLoop', href: '/', img: logo }}
			class="border-b border-gray-300 pb-2 dark:border-gray-700"
		/>

		<SidebarItem label="Overview" href="/dashboard/overview">
			{#snippet icon()}
				<ChartPieOutline class="h-5 w-5 text-gray-500 group-hover:text-gray-900" />
			{/snippet}
		</SidebarItem>

		<SidebarItem label="Inbox" href="/dashboard/inbox">
			{#snippet icon()}
				<MessageDotsOutline class="h-5 w-5 text-gray-500 group-hover:text-gray-900" />
			{/snippet}
		</SidebarItem>

		<SidebarItem label="Insight" href="/dashboard/insight">
			{#snippet icon()}
				<LightbulbOutline class="h-5 w-5 text-gray-500 group-hover:text-gray-900" />
			{/snippet}
		</SidebarItem>

		<SidebarItem label="Approval" href="/dashboard/approval">
			{#snippet icon()}
				<PaperPlaneOutline class="h-5 w-5 text-gray-500 group-hover:text-gray-900" />
			{/snippet}
		</SidebarItem>
	</SidebarGroup>

	<div
		class="absolute bottom-0 left-0 flex w-full items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
	>
		<div>
			<div class="font-semibold text-gray-900 dark:text-white">{currentUserQuery.data?.name}</div>
			<div class="text-sm text-gray-500 dark:text-gray-400">{currentUserQuery.data?.email}</div>
		</div>
		<Button onclick={() => signOut()} color="light" class="border-none bg-transparent" size="sm">
			<ArrowRightToBracketOutline class="h-5 w-5 text-gray-500 group-hover:text-gray-900" />
		</Button>
	</div>
</Sidebar>
