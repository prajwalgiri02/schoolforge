import fs from 'node:fs';
import path from 'node:path';
import { copyTemplateDir, exists, isEmptyDir, readJson, writeJson } from '../fsutil.js';
import { TARGETS_DIR } from '../paths.js';
import { commandExists, run } from '../run.js';

const dir = path.join(TARGETS_DIR, 'laravel-inertia-react');

/** Skeleton files replaced by the TypeScript + Inertia entry points. */
const obsoleteSkeletonFiles = ['resources/js/app.js', 'resources/js/bootstrap.js', 'resources/views/welcome.blade.php', 'vite.config.ts'];

const frontendDependencies = {
    devDependencies: {
        '@inertiajs/react': '^3.0.0',
        '@types/react': '^19.2.0',
        '@types/react-dom': '^19.2.0',
        '@vitejs/plugin-react': '^6.0.0',
        'lucide-react': '^1.8.0',
        react: '^19.2.0',
        'react-dom': '^19.2.0',
        typescript: '^5.9.0',
    },
};

export function mergePackageJson(projectDir) {
    const file = path.join(projectDir, 'package.json');
    const pkg = exists(file) ? readJson(file) : { private: true, type: 'module', scripts: { build: 'vite build', dev: 'vite' } };

    pkg.devDependencies = { ...(pkg.devDependencies ?? {}), ...frontendDependencies.devDependencies };
    pkg.devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)));
    writeJson(file, pkg);
}

export default {
    name: 'laravel-inertia-react',
    label: 'Laravel 13 + Inertia v3 + React + Tailwind CSS',
    schoolDir: 'resources/js/school',
    siteDataFile: 'resources/school/site.json',
    adapterFile: path.join(dir, 'adapter.tsx'),

    /**
     * Creates the Laravel skeleton (unless skipped) before the overlay is applied.
     */
    prepare(projectDir, { skipInstall, log }) {
        if (skipInstall) {
            if (!exists(path.join(projectDir, 'artisan'))) {
                log('  --skip-install: writing the SchoolForge overlay only. Apply it on top of a fresh `laravel new` app before running.');
            }

            return;
        }

        if (exists(path.join(projectDir, 'artisan'))) {
            log('  Existing Laravel app detected, applying the SchoolForge overlay on top of it.');
        } else {
            if (!isEmptyDir(projectDir)) {
                throw new Error(`${projectDir} is not empty and is not a Laravel app. Choose an empty directory.`);
            }

            if (!commandExists('composer')) {
                throw new Error('composer is required to create the Laravel app. Install PHP 8.3+ and Composer, or rerun with --skip-install.');
            }

            run('composer', ['create-project', 'laravel/laravel', projectDir, '--no-interaction', '--prefer-dist'], { log });
        }

        run('composer', ['require', 'inertiajs/inertia-laravel:^3.0', '--no-interaction'], { cwd: projectDir, log });
    },

    scaffold(projectDir, vars) {
        for (const file of obsoleteSkeletonFiles) {
            fs.rmSync(path.join(projectDir, file), { force: true });
        }

        const written = copyTemplateDir(path.join(dir, 'files'), projectDir, vars);
        mergePackageJson(projectDir);

        return written;
    },

    install(projectDir, { build = false, log }) {
        if (!commandExists('npm')) {
            throw new Error('npm is required to install the frontend. Install Node.js 20+ or rerun with --skip-install.');
        }

        if (exists(path.join(projectDir, 'artisan')) && commandExists('php')) {
            run('php', ['artisan', 'migrate', '--force', '--no-interaction'], { cwd: projectDir, log });
            run('php', ['artisan', 'storage:link', '--no-interaction'], { cwd: projectDir, log });
        }

        run('npm', ['install'], { cwd: projectDir, log });

        if (build) {
            run('npm', ['run', 'build'], { cwd: projectDir, log });
        }
    },

    nextSteps(relativeDir, { installed }) {
        return [
            `cd ${relativeDir}`,
            ...(installed ? [] : ['composer install', 'npm install', 'php artisan migrate', 'php artisan storage:link']),
            'php artisan school:admin you@school.edu   (creates your admin panel login)',
            'composer run dev   (or: php artisan serve + npm run dev)',
            'open http://localhost:8000 (website) and http://localhost:8000/admin (admin panel)',
        ];
    },
};
