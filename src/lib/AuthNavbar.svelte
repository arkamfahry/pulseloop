<script lang="ts">
	import { Navbar } from 'flowbite-svelte';
	import logo from '$lib/assets/favicon.svg';
</script>

<Navbar fluid class="border-b border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
	<a href="/" class="flex items-center">
		<img src={logo} class="mr-3 h-9 w-9" alt="PulseLoop" />
		<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
			>PulseLoop</span
		>
	</a>
</Navbar>
