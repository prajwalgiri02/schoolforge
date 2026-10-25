import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType, ReactNode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { AdminPreviewFrame } from '@/preview/AdminPreviewFrame';

const appName = import.meta.env.VITE_APP_NAME || 'SchoolForge Studio';

type PageModule = { default: ComponentType & { layout?: (page: ReactNode) => ReactNode } };

createInertiaApp({
    title: (title) => (document.documentElement.hasAttribute('data-hosted') ? title : title ? `${title} · ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob<PageModule>('./pages/**/*.tsx');
        // The generated Laravel site's admin panel, previewed in Studio (PreviewAdminController).
        const adminPages = import.meta.glob<PageModule>('../../generator/targets/laravel-inertia-react/files/resources/js/pages/Admin/**/*.tsx');
        const adminPage = adminPages[`../../generator/targets/laravel-inertia-react/files/resources/js/pages/${name}.tsx`];

        if (name.startsWith('Admin/') && adminPage) {
            return adminPage().then((module) => {
                module.default.layout = (page) => <AdminPreviewFrame>{page}</AdminPreviewFrame>;

                return module.default;
            });
        }

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
