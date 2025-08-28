<script lang="ts">
	import {
		Button,
		Navbar,
		NavBrand,
		NavLi,
		NavUl,
		NavHamburger,
		Search,
		ToolbarButton
	} from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';
	import logo from '$lib/assets/favicon.svg';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';

	let { variant }: { variant: 'app' | 'auth' | 'mobile' } = $props();

	const isAuthenticated = $derived(useAuth().isAuthenticated);

	async function signOut() {
		try {
			await authClient.signOut();
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}

	let hidden = $state(true);
	function toggle() {
		hidden = !hidden;
	}
</script>

<Navbar fluid class="border-b border-gray-300 dark:border-gray-700">
	<NavBrand href="/">
		<img src={logo} class="mr-3 h-9 w-9" alt="PulseLoop" />
		<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
			>PulseLoop</span
		>
	</NavBrand>
	{#if variant === 'auth'}
		<div class="flex md:order-2">
			{#if !isAuthenticated}
				<Button href="/signin">Sign in</Button>
			{:else}
				<Button onclick={() => signOut()}>Sign out</Button>
			{/if}
		</div>
	{/if}
	{#if variant === 'mobile'}
		<div class="flex md:order-2">
			<ToolbarButton class="block md:hidden" onclick={toggle}>
				<SearchOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" />
			</ToolbarButton>
			<div class="hidden md:block">
				<Search size="md" class="ms-auto" placeholder="Search..." />
			</div>
			<NavHamburger />
		</div>
		{#if !hidden}
			<div class="mt-2 w-full md:hidden" transition:fade>
				<Search size="md" placeholder="Search..." />
			</div>
		{/if}
	{/if}
</Navbar>
