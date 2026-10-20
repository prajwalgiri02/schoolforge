import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

/*
 * These tests write themes and components into the registry, so they run against
 * a temporary copy of it via SCHOOLFORGE_REGISTRY (set before the modules load).
 */
const ROOT = path.resolve(import.meta.dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'schoolforge-test-'));
const registryCopy = path.join(tmp, 'registry');
fs.cpSync(path.join(ROOT, 'registry'), registryCopy, { recursive: true });
process.env.SCHOOLFORGE_REGISTRY = registryCopy;

const { createProject } = await import('../src/commands/create.js');
const { add, remove, sync, useTheme } = await import('../src/commands/manage.js');
const { newComponent, newTheme } = await import('../src/commands/registry.js');
const { readLock } = await import('../src/lib/project.js');
const { getTheme } = await import('../src/lib/registry.js');

const quiet = () => {};

after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const configFile = path.join(ROOT, 'examples', 'school.config.json');
const read = (...parts) => fs.readFileSync(path.join(...parts), 'utf8');
const readJson = (...parts) => JSON.parse(read(...parts));

describe('Next.js project lifecycle', () => {
    const dir = path.join(tmp, 'next-site');

    before(() => {
        createProject({ directory: dir, configFile, theme: 'classic', skipInstall: true, log: quiet });
    });

    it('scaffolds the app, school runtime and generated files', () => {
        for (const file of ['package.json', 'src/app/[[...slug]]/page.tsx', 'src/app/api/contact/route.ts', 'src/school/adapter.tsx', 'src/school/runtime/ui.tsx', 'src/school/components/hero/index.tsx', 'school.config.json', 'SCHOOLFORGE.md', '.gitignore']) {
            assert.ok(fs.existsSync(path.join(dir, file)), `${file} exists`);
        }

        assert.equal(readJson(dir, 'package.json').name, 'riverside-heights');
        assert.match(read(dir, 'src/school/theme.css'), /--color-primary: #1b365d/);
        assert.match(read(dir, 'src/school/registry.ts'), /'principal-message': PrincipalMessage,/);
        assert.ok(!fs.existsSync(path.join(dir, 'src/school/components/rich-text')), 'unused components are not installed');

        const lock = readLock(dir);
        assert.equal(lock.target, 'nextjs');
        assert.equal(lock.theme, 'classic');
        assert.ok(lock.components.includes('navbar'));
    });

    it('refuses to generate over an existing project', () => {
        assert.throws(() => createProject({ directory: dir, configFile, skipInstall: true, log: quiet }), /already a SchoolForge project/);
    });

    it('keeps local component edits on sync unless forced', () => {
        const heroFile = path.join(dir, 'src/school/components/hero/index.tsx');
        const original = fs.readFileSync(heroFile, 'utf8');
        fs.writeFileSync(heroFile, `${original}\n// school-specific tweak\n`);

        const kept = sync({ projectDir: dir, log: quiet });
        assert.ok(kept.skipped.includes('src/school/components/hero/index.tsx'));
        assert.match(fs.readFileSync(heroFile, 'utf8'), /school-specific tweak/);

        const forced = sync({ projectDir: dir, force: true, log: quiet });
        assert.ok(forced.written.includes('src/school/components/hero/index.tsx'));
        assert.equal(fs.readFileSync(heroFile, 'utf8'), original);
    });

    it('regenerates site data when the config changes', () => {
        const config = readJson(dir, 'school.config.json');
        config.school.name = 'Riverside Heights International';
        config.colors = { primary: '#7f1d1d' };
        fs.writeFileSync(path.join(dir, 'school.config.json'), JSON.stringify(config));

        sync({ projectDir: dir, log: quiet });

        assert.equal(readJson(dir, 'src/school/site.json').school.name, 'Riverside Heights International');
        assert.match(read(dir, 'src/school/theme.css'), /--color-primary: #7f1d1d/);
    });

    it('adds a component to a page and removes components everywhere', () => {
        add({ projectDir: dir, names: ['rich-text'], page: '/about', log: quiet });

        let config = readJson(dir, 'school.config.json');
        assert.ok(config.pages.find((page) => page.slug === '/about').sections.some((section) => section.type === 'rich-text'));
        assert.ok(fs.existsSync(path.join(dir, 'src/school/components/rich-text/index.tsx')));

        remove({ projectDir: dir, names: ['testimonials', 'rich-text'], log: quiet });
        config = readJson(dir, 'school.config.json');
        const site = readJson(dir, 'src/school/site.json');

        assert.ok(!config.pages.some((page) => page.sections.some((section) => section.type === 'testimonials')));
        assert.ok(!site.pages.some((page) => page.sections.some((section) => section.type === 'testimonials')));
        assert.ok(!fs.existsSync(path.join(dir, 'src/school/components/testimonials')));
        assert.doesNotMatch(read(dir, 'src/school/registry.ts'), /Testimonials/);
        assert.ok(!readLock(dir).components.includes('rich-text'));
    });

    it('rejects unknown components and pages', () => {
        assert.throws(() => add({ projectDir: dir, names: ['unicorn'], log: quiet }), /not in the registry/);
        assert.throws(() => add({ projectDir: dir, names: ['faq'], page: '/missing', log: quiet }), /Page "\/missing" not found/);
    });

    it('registers project-specific custom components', () => {
        const customDir = path.join(dir, 'src/school/custom/sports-houses');
        fs.mkdirSync(customDir, { recursive: true });
        fs.writeFileSync(path.join(customDir, 'index.tsx'), 'export default function SportsHouses() { return null; }\n');

        const config = readJson(dir, 'school.config.json');
        config.pages[0].sections.push({ type: 'sports-houses' });
        fs.writeFileSync(path.join(dir, 'school.config.json'), JSON.stringify(config));

        const result = sync({ projectDir: dir, log: quiet });

        assert.deepEqual(result.custom, ['sports-houses']);
        assert.match(read(dir, 'src/school/registry.ts'), /'sports-houses': CustomSportsHouses,/);
    });

    it('switches theme and applies theme component overrides', () => {
        newTheme({ name: 'sunrise', from: 'modern', log: quiet });
        const themeDir = path.join(registryCopy, 'themes', 'sunrise');
        const themeJson = readJson(themeDir, 'theme.json');
        themeJson.tokens.colors.primary = '#ea580c';
        fs.writeFileSync(path.join(themeDir, 'theme.json'), JSON.stringify(themeJson));
        fs.mkdirSync(path.join(themeDir, 'components', 'hero'), { recursive: true });
        fs.writeFileSync(path.join(themeDir, 'components', 'hero', 'index.tsx'), 'export default function SunriseHero() { return null; }\n');

        const theme = getTheme('sunrise');
        assert.equal(theme.tokens.fonts.heading.family, 'Plus Jakarta Sans', 'inherits from modern');
        assert.equal(theme.variants.testimonials, 'carousel');

        useTheme({ projectDir: dir, name: 'sunrise', log: quiet });

        assert.match(read(dir, 'src/school/components/hero/index.tsx'), /SunriseHero/);
        assert.match(read(dir, 'src/school/theme.css'), /from theme "sunrise"/);
        assert.equal(readLock(dir).theme, 'sunrise');

        useTheme({ projectDir: dir, name: 'classic', log: quiet });
        assert.doesNotMatch(read(dir, 'src/school/components/hero/index.tsx'), /SunriseHero/);
    });

    it('scaffolds new registry components that can be added to projects', () => {
        newComponent({ name: 'sports-highlights', variants: ['grid', 'list'], log: quiet });
        add({ projectDir: dir, names: ['sports-highlights'], page: '/', variant: 'list', log: quiet });

        assert.ok(fs.existsSync(path.join(dir, 'src/school/components/sports-highlights/index.tsx')));
        assert.deepEqual(readJson(dir, 'school.config.json').pages[0].sections.at(-1), { type: 'sports-highlights', variant: 'list' });
        assert.throws(() => newComponent({ name: 'Bad Name', log: quiet }), /kebab-case/);
        assert.throws(() => newTheme({ name: 'classic', log: quiet }), /already exists/);
    });
});

describe('Laravel overlay', () => {
    it('writes the Laravel + Inertia overlay and merges frontend dependencies', () => {
        const dir = path.join(tmp, 'laravel-site');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ private: true, devDependencies: { vite: '^8.0.0' } }));
        fs.mkdirSync(path.join(dir, 'resources/js'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'resources/js/app.js'), '// skeleton');

        createProject({ directory: dir, configFile, target: 'laravel-inertia-react', theme: 'elegant', skipInstall: true, force: true, log: quiet });

        for (const file of ['routes/web.php', 'app/Support/SchoolSite.php', 'app/Http/Controllers/SchoolPageController.php', 'resources/js/app.tsx', 'resources/js/pages/School/Page.tsx', 'resources/js/school/adapter.tsx', 'resources/school/site.json', 'tests/Feature/SchoolSiteTest.php', 'app/Support/ContentSchema.php', 'app/Http/Controllers/Admin/ContentController.php', 'app/Console/Commands/CreateSchoolAdmin.php', 'resources/js/pages/Admin/Content/Edit.tsx', 'tests/Feature/AdminPanelTest.php']) {
            assert.ok(fs.existsSync(path.join(dir, file)), `${file} exists`);
        }

        assert.ok(!fs.existsSync(path.join(dir, 'resources/js/app.js')), 'skeleton JS entry is replaced');
        assert.match(read(dir, 'resources/js/school/adapter.tsx'), /@inertiajs\/react/);

        const pkg = readJson(dir, 'package.json');
        assert.equal(pkg.devDependencies.vite, '^8.0.0');
        assert.ok(pkg.devDependencies['@inertiajs/react']);
        assert.ok(pkg.devDependencies['lucide-react']);
        assert.equal(readJson(dir, 'resources/school/site.json').theme.name, 'elegant');
    });
});
