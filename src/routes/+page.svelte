<script>
	import { Navbar, NavBrand, Button } from 'flowbite-svelte';
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import logo from '$lib/assets/favicon.svg';

	const isAuthenticated = $derived(useAuth().isAuthenticated);
	const { signOut } = useAuth();
</script>

<div class="flex h-screen flex-col bg-white dark:bg-gray-900">
	<header class="absolute top-0 z-10 w-full bg-transparent">
		<Navbar fluid class="bg-gray-50 dark:bg-gray-900">
			<NavBrand href="/">
				<img src={logo} class="mr-3 h-9 w-9" alt="PulseLoop" />
				<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
					>PulseLoop</span
				>
			</NavBrand>
			<div class="flex md:order-2">
				{#if !isAuthenticated}
					<Button href="/signin">Sign in</Button>
				{:else}
					<Button onclick={() => signOut()}>Sign out</Button>
				{/if}
			</div>
		</Navbar>
	</header>
	<main class="flex flex-1 flex-col items-center justify-center text-center">
		<div class="mb-4">
			<img src={logo} class="mr-3 h-12 w-12" alt="PulseLoop" />
		</div>
		<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
			PulseLoop
			<br />
			Real-Time Feedback Engine
		</h1>
		<div class="mt-10">
			{#if !isAuthenticated}
				<Button href="/signin" size="xl">Sign In</Button>
			{/if}
		</div>
	</main>
</div>
