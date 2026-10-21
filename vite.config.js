import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const registryDir = path.resolve(root, 'generator/registry');

/**
 * Registry components import `../../adapter` and `../registry`, files that only
 * exist inside generated projects. For Studio's live preview, point those imports
 * at Studio's own preview adapter and component map instead.
 */
function schoolforgePreviewRuntime() {
    const replacements = {
        [path.join(registryDir, 'adapter')]: path.resolve(root, 'resources/js/preview/adapter.tsx'),
        [path.join(registryDir, 'registry')]: path.resolve(root, 'resources/js/preview/section-registry.ts'),
    };

    return {
        name: 'schoolforge-preview-runtime',
        enforce: 'pre',
        resolveId(source, importer) {
            if (!importer || !importer.startsWith(registryDir) || !source.startsWith('.')) {
                return null;
            }

            return replacements[path.resolve(path.dirname(importer), source)] ?? null;
        },
    };
}

export default defineConfig({
    plugins: [
        schoolforgePreviewRuntime(),
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(root, 'resources/js'),
            '@admin': path.resolve(root, 'generator/targets/laravel-inertia-react/files/resources/js/admin'),
            '@registry': registryDir,
        },
    },
    ssr: {
        // Bundle every dependency into bootstrap/ssr/ssr.js so it runs with node alone.
        noExternal: true,
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**', '**/storage/app/**', '**/generator/test/**'],
        },
    },
});
