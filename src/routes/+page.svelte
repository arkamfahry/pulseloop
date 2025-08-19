<script>
	import { Button } from 'flowbite-svelte';
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import logo from '$lib/assets/favicon.svg';
	import Navbar from '$lib/Navbar.svelte';

	const isAuthenticated = $derived(useAuth().isAuthenticated);
</script>

<div class="flex h-screen flex-col bg-white dark:bg-gray-900">
	<header class="absolute top-0 z-10 w-full bg-transparent">
		<Navbar variant="auth" />
	</header>
	<main class="flex flex-1 flex-col items-center justify-center text-center">
		<div class="mb-4">
			<img src={logo} class="mr-3 h-24 w-24" alt="PulseLoop" />
		</div>
		<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
			PulseLoop
			<br />
			Real-Time Feedback Engine
		</h1>
		<div class="mt-6">
			{#if !isAuthenticated}
				<Button href="/signin" size="lg">Sign In</Button>
			{/if}
		</div>
	</main>
</div>
