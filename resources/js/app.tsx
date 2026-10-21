import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'SchoolForge Studio';

createInertiaApp({
    title: (title) => (document.documentElement.hasAttribute('data-hosted') ? title : title ? `${title} · ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx');
        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Unknown Inertia page: ${name}`);
        }

        return page().then((module) => module.default);
    },
    setup({ el, App, props }) {
        // Published school pages arrive already rendered (see ssr.tsx); take over that HTML.
        if (el.hasChildNodes()) {
            hydrateRoot(el, <App {...props} />);
        } else {
            createRoot(el).render(<App {...props} />);
        }
    },
    progress: {
        color: '#4f46e5',
    },
});
