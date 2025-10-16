<script lang="ts">
	import Sidebar from '$lib/dashboard/Sidebar.svelte';
	let { children } = $props();
</script>

<div class="flex h-screen">
	<Sidebar />

	<main class=" flex-1 overflow-auto px-2">
		{@render children?.()}
	</main>
</div>
