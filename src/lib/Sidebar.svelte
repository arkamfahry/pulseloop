<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/assets/favicon.svg';
	import {
		Sidebar,
		SidebarBrand,
		SidebarButton,
		SidebarGroup,
		SidebarItem,
		uiHelpers
	} from 'flowbite-svelte';
	import {
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
</script>

<SidebarButton onclick={sidebarUi.toggle} class="fixed top-4 left-4 z-50" />

<Sidebar
	{activeUrl}
	backdrop={false}
	{isOpen}
	{closeSidebar}
	position="static"
	params={{ x: -50, duration: 50 }}
	class="h-full w-64 border-r border-gray-300 dark:border-gray-700"
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
</Sidebar>
