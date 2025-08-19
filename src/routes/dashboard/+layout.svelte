<script lang="ts">
	import DashboardSidebar from '$lib/DashboardSidebar.svelte';
	let { children } = $props();
</script>

<div class="flex h-screen">
	<DashboardSidebar />

	<main class="flex-1 overflow-auto p-6">
		{@render children?.()}
	</main>
</div>
