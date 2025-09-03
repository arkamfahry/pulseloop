<script lang="ts">
	import Navbar from '$lib/Navbar.svelte';

	let { children } = $props();
</script>

<header class="absolute top-0 z-10 w-full bg-transparent">
	<Navbar variant="app" />
</header>

<main class="bg-white dark:bg-gray-900">
	{@render children?.()}
</main>
