import type { LayoutServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { api } from '$convex/_generated/api.js';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const client = createConvexHttpClient({ cookies });
	const currentUser = await client.query(api.auth.getCurrentUser, {});

	const publicRoutes = ['/auth/signin', '/auth/signup', '/'];
	const isPublicRoute = publicRoutes.includes(url.pathname);

	if (!currentUser && !isPublicRoute) {
		throw redirect(302, '/auth/signin');
	}

	if (currentUser) {
		if (url.pathname === '/auth/signin' || url.pathname === '/auth/signup') {
			if (currentUser.role === 'admin') {
				throw redirect(302, '/dashboard');
			} else if (currentUser.role === 'user') {
				throw redirect(302, '/wall');
			}
		}

		if (currentUser.role === 'user' && url.pathname.startsWith('/dashboard')) {
			throw redirect(302, '/wall');
		}

		if (currentUser.role === 'admin' && url.pathname.startsWith('/wall')) {
			throw redirect(302, '/dashboard');
		}
	}

	return {
		currentUser
	};
};
