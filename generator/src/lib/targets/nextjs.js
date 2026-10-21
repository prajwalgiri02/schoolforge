import path from 'node:path';
import { copyTemplateDir, exists, readJson, renderTemplateFiles, writeJson } from '../fsutil.js';
import { TARGETS_DIR } from '../paths.js';
import { commandExists, run } from '../run.js';

const dir = path.join(TARGETS_DIR, 'nextjs');

export default {
    name: 'nextjs',
    label: 'Next.js (App Router) + React + Tailwind CSS',
    schoolDir: 'src/school',
    siteDataFile: 'src/school/site.json',
    adapterFile: path.join(dir, 'adapter.tsx'),

    scaffold(projectDir, vars) {
        return copyTemplateDir(path.join(dir, 'files'), projectDir, vars);
    },

    /**
     * App files `schoolforge sync` keeps up to date (local edits are preserved).
     * package.json is merged instead, so a school's own dependencies survive.
     */
    appFiles(vars) {
        const files = renderTemplateFiles(path.join(dir, 'files'), vars);
        files.delete('package.json');

        return files;
    },

    /**
     * Adds or raises the dependencies and scripts the current template needs.
     */
    mergePackageJson(projectDir, vars) {
        const file = path.join(projectDir, 'package.json');
        const template = JSON.parse(renderTemplateFiles(path.join(dir, 'files'), vars).get('package.json').toString());

        if (!exists(file)) {
            writeJson(file, template);

            return;
        }

        const pkg = readJson(file);

        for (const key of ['dependencies', 'devDependencies', 'scripts']) {
            pkg[key] = { ...(pkg[key] ?? {}), ...template[key] };
        }

        writeJson(file, pkg);
    },

    install(projectDir, { build = false, log }) {
        if (!commandExists('npm')) {
            throw new Error('npm is required to install the Next.js project. Install Node.js 20+ or rerun with --skip-install.');
        }

        run('npm', ['install'], { cwd: projectDir, log });

        if (build) {
            run('npm', ['run', 'build'], { cwd: projectDir, log });
        }
    },

    nextSteps(relativeDir, { installed }) {
        return [`cd ${relativeDir}`, ...(installed ? [] : ['npm install']), 'npm run dev', 'open http://localhost:3000'];
    },
};
