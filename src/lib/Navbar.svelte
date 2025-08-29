<script lang="ts">
	import { Button, Navbar, NavBrand } from 'flowbite-svelte';
	import logo from '$lib/assets/favicon.svg';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';

	let { variant }: { variant: 'app' | 'auth' } = $props();

	const isAuthenticated = $derived(useAuth().isAuthenticated);

	async function signOut() {
		try {
			await authClient.signOut();
		} catch (error) {
			console.error('Sign out error:', error);
		}
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
				<Button href="/auth/signin">Sign in</Button>
			{:else}
				<Button onclick={() => signOut()}>Sign out</Button>
			{/if}
		</div>
	{/if}
</Navbar>
