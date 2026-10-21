import { createInertiaApp } from '@inertiajs/react';

/**
 * One entry for the browser and for server-side rendering: the @inertiajs/vite
 * plugin resolves pages from ./pages and builds the SSR server from this file.
 */
createInertiaApp({
    title: (title) => title,
    pages: './pages',
    progress: {
        color: 'var(--color-accent)',
    },
});
