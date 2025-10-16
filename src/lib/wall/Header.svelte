<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$convex/_generated/api';
	import logo from '$lib/assets/favicon.svg';
	import { authClient } from '$lib/auth-client';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery } from 'convex-svelte';
	import {
		Button,
		Dropdown,
		DropdownHeader,
		Navbar,
		NavBrand,
		ToolbarButton
	} from 'flowbite-svelte';
	import { AlignJustifyOutline, SearchOutline } from 'flowbite-svelte-icons';

	interface Props {
		onSearchToggle: () => void;
	}

	let { onSearchToggle }: Props = $props();

	const isAuthenticated = $derived(useAuth().isAuthenticated);
	const currentUserQuery = useQuery(api.auth.getCurrentUser, {});

	async function signOut() {
		try {
			await authClient.signOut();
			goto('/');
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}
</script>

<header class="sticky top-0 left-0 z-30 w-full bg-white shadow dark:bg-gray-900">
	<Navbar>
		<NavBrand href="/">
			<img src={logo} class="mr-3 h-9 w-9" alt="PulseLoop" />
			<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
				>PulseLoop</span
			>
		</NavBrand>
		<div class="flex space-y-1 md:order-2">
			<ToolbarButton class="block" onclick={onSearchToggle}>
				<SearchOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" />
			</ToolbarButton>
			<ToolbarButton id="menu" class="block">
				<AlignJustifyOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" />
			</ToolbarButton>
			<Dropdown placement="bottom" triggeredBy="#menu">
				<DropdownHeader>
					<span class="block text-sm">{currentUserQuery.data?.name}</span>
					<span class="block truncate text-sm font-medium">{currentUserQuery.data?.email}</span>
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
