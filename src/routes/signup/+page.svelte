<script lang="ts">
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { goto } from '$app/navigation';
	import { Card, Label, Input, Checkbox, Button } from 'flowbite-svelte';
	import AuthNavbar from '$lib/AuthNavbar.svelte';

	const { signIn } = useAuth();

	let error: string | null = $state(null);
	let submitting = $state(false);
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let remember = $state(false);

	function handleEmailSignUp(name: string, email: string, password: string) {
		return signIn('password', {
			flow: 'signUp',
			name: name,
			email: email,
			password: password
		});
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		submitting = true;

		try {
			await handleEmailSignUp(name, email, password);
			goto('/');
		} catch (err: any) {
			if (err?.message) {
				error = err.message;
			} else {
				error = 'An unexpected error occurred. Please try again';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<section class="bg-white dark:bg-gray-900">
	<AuthNavbar />

	<div class="mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-8 lg:py-0">
		<Card
			class="w-full rounded-2xl bg-white p-6 shadow sm:max-w-md md:mt-0 dark:border dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="space-y-4 md:space-y-6">
				<h1
					class="text-xl leading-tight font-bold tracking-tight text-gray-900 md:text-2xl dark:text-white"
				>
					Welcome to PulseLoop
				</h1>

				<form class="space-y-4 md:space-y-6" onsubmit={handleSubmit}>
					<div>
						<div class="mb-2 block">
							<Label for="name">Name</Label>
						</div>
						<Input id="name" bind:value={name} placeholder="Enter your name" required type="text" />
					</div>

					<div>
						<div class="mb-2 block">
							<Label for="email">Email</Label>
						</div>
						<Input
							id="email"
							bind:value={email}
							placeholder="Enter your email"
							required
							type="email"
						/>
					</div>

					<div>
						<div class="mb-2 block">
							<Label for="password">Password</Label>
						</div>
						<Input
							id="password"
							bind:value={password}
							placeholder="••••••••"
							required
							type="password"
						/>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-start">
							<Checkbox id="remember" bind:checked={remember} />
							<Label for="remember" class="ml-2">Remember me</Label>
						</div>
						<a
							href="/lost-password"
							class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
						>
							Lost Password?
						</a>
					</div>

					<Button class="w-full" type="submit" disabled={submitting}>
						{submitting ? 'Signing up...' : 'Sign Up'}
					</Button>

					<p class="text-sm font-light text-gray-500 dark:text-gray-400">
						Already have an account?
						<a
							href="/signin"
							class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>
							Sign In
						</a>
					</p>

					{#if error}
						<div class="rounded-md border-2 border-red-500/50 bg-red-500/20 p-2">
							<p class="text-foreground font-mono text-xs">
								Error signing up: {error}
							</p>
						</div>
					{/if}
				</form>
			</div>
		</Card>
	</div>
</section>
