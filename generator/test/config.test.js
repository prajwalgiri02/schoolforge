import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { contrastRatio, ensureContrast, readableOn } from '../src/lib/color.js';
import { buildSite, buildSites, buildThemeCss, googleFontsUrl, resolveColors, slugify, usedComponents, validateConfig } from '../src/lib/config.js';
import { readJson } from '../src/lib/fsutil.js';
import { ROOT } from '../src/lib/paths.js';
import { getTheme, listComponents, listThemes } from '../src/lib/registry.js';

const example = () => readJson(path.join(ROOT, 'examples', 'school.config.json'));
const minimal = () => ({ school: { name: 'Test School' } });
const componentNames = new Set(listComponents().map((component) => component.name));

describe('color helpers', () => {
    it('computes WCAG contrast', () => {
        assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21);
        assert.equal(readableOn('#1b365d'), '#ffffff');
        assert.equal(readableOn('#fbbf24'), '#111827');
    });

    it('darkens a colour until it is readable on the background', () => {
        const result = ensureContrast('#fbbf24', '#ffffff', 4.5);

        assert.ok(contrastRatio(result, '#ffffff') >= 4.5);
    });
});

describe('validateConfig', () => {
    it('accepts the example config', () => {
        assert.deepEqual(validateConfig(example(), { components: componentNames }), []);
    });

    it('requires a school name', () => {
        assert.match(validateConfig({ school: {} }).join('\n'), /school\.name is required/);
        assert.match(validateConfig({}).join('\n'), /school is required/);
    });

    it('rejects unknown targets, themes, colours and dates', () => {
        const errors = validateConfig({
            ...minimal(),
            target: 'rails',
            theme: 'nope',
            colors: { primary: 'blue', sparkle: '#fff' },
            events: [{ title: 'Sports day', date: '12/11/2026' }, { title: 'Exams', date: '2026-12-10', endDate: '2026-12-01' }],
            admissions: { deadline: 'soon' },
        }).join('\n');

        assert.match(errors, /target must be one of/);
        assert.match(errors, /theme "nope" does not exist/);
        assert.match(errors, /colors\.primary must be a hex colour/);
        assert.match(errors, /colors\.sparkle is not a known colour token/);
        assert.match(errors, /events\[0\]\.date must use YYYY-MM-DD/);
        assert.match(errors, /events\[1\]\.endDate must not be before date/);
        assert.match(errors, /admissions\.deadline must use YYYY-MM-DD/);
    });

    it('requires item fields in collections', () => {
        assert.match(validateConfig({ ...minimal(), faqs: [{ question: 'Why?' }] }).join('\n'), /faqs\[0\]\.answer is required/);
    });

    it('detects duplicate news slugs', () => {
        const errors = validateConfig({ ...minimal(), news: [{ title: 'Hello world' }, { title: 'Hello World!' }] });

        assert.match(errors.join('\n'), /news slug "hello-world" is used more than once/);
    });

    it('validates custom pages', () => {
        const errors = validateConfig(
            {
                ...minimal(),
                pages: [
                    { slug: '/About Us', title: 'About', sections: [] },
                    { slug: '/x', title: 'X', sections: [{ type: 'does-not-exist' }] },
                ],
            },
            { components: componentNames },
        ).join('\n');

        assert.match(errors, /slug must look like/);
        assert.match(errors, /unknown component "does-not-exist"/);
        assert.match(errors, /must include a home page/);
    });
});

describe('buildSite', () => {
    it('builds every preset page and article pages for the example school', () => {
        const { site, warnings } = buildSite(example(), getTheme('classic'));
        const slugs = site.pages.map((page) => page.slug);

        assert.deepEqual(warnings, []);
        assert.ok(slugs.includes('/'));
        assert.ok(slugs.includes('/faculty'));
        assert.ok(slugs.includes('/news/riverside-students-win-national-science-olympiad'));
        assert.ok(!slugs.includes('/news/admissions-open-for-the-2027-session'), 'news without a body gets no article page');
        assert.ok(!site.navigation.some((link) => link.href.startsWith('/news/')));
    });

    it('gives every photo album its own page with slugs shared by all languages', () => {
        const config = {
            ...minimal(),
            languages: ['en', 'ne'],
            albums: [{ title: 'Annual Day', photos: [{ caption: 'Dance' }] }, { title: 'वार्षिकोत्सव' }],
            videos: [{ title: 'Tour', url: 'https://youtu.be/aqz-KE-bpKQ' }],
            translations: { ne: { albums: [{ title: 'वार्षिक दिवस' }] } },
        };
        const { sites } = buildSites(config, getTheme('classic'));
        const albumPages = (site) => site.pages.filter((page) => page.slug.startsWith('/gallery/'));

        assert.deepEqual(albumPages(sites.en).map((page) => page.slug), ['/gallery/annual-day', '/gallery/album-2']);
        assert.deepEqual(albumPages(sites.ne).map((page) => [page.slug, page.title]), [['/gallery/annual-day', 'वार्षिक दिवस'], ['/gallery/album-2', 'वार्षिकोत्सव']]);
        assert.deepEqual(albumPages(sites.en)[0].sections, [{ type: 'album', albumSlug: 'annual-day' }]);
        assert.ok(sites.en.pages.find((page) => page.slug === '/gallery').sections.some((section) => section.type === 'videos'));
        assert.ok(!sites.en.navigation.some((link) => link.href.startsWith('/gallery/')));
    });

    it('validates albums and videos', () => {
        const errors = validateConfig({
            ...minimal(),
            albums: [{ title: 'Sports' }, { title: 'Sports' }, { title: 'Trip', photos: 'many' }],
            videos: [{ title: 'Tour' }, { title: 'Tour', url: 'youtube.com/watch?v=1' }],
            news: [{ title: 'Win', tags: 'sports' }],
        }).join('\n');

        assert.match(errors, /news\[0\]\.tags must be a list of words/);
        assert.match(errors, /albums slug "sports" is used more than once/);
        assert.match(errors, /albums\[2\]\.photos must be a list of photos/);
        assert.match(errors, /videos\[0\]\.url is required/);
        assert.match(errors, /videos\[1\]\.url must be a full link/);
    });

    it('drops preset pages and sections that have no content', () => {
        const { site } = buildSite(minimal(), getTheme('classic'));
        const slugs = site.pages.map((page) => page.slug);

        assert.deepEqual(slugs, ['/', '/contact']);
        assert.deepEqual(
            site.pages[0].sections.map((section) => section.type),
            ['hero', 'cta'],
        );
        assert.deepEqual(
            site.layout.header.map((section) => section.type),
            ['announcement-bar', 'navbar'],
        );
    });

    it('keeps explicitly configured pages even when empty', () => {
        const config = { ...minimal(), pages: [{ slug: '/', title: 'Home', sections: [{ type: 'faculty' }] }] };
        const { site } = buildSite(config, getTheme('classic'));

        assert.deepEqual(site.pages[0].sections, [{ type: 'faculty', variant: 'grid' }]);
    });

    it('applies theme variants, config overrides and warns about unknown variants', () => {
        const config = { ...example(), variants: { hero: 'centered' }, pages: [{ slug: '/', title: 'Home', sections: [{ type: 'hero' }, { type: 'stats', variant: 'sparkly' }, { type: 'programs' }] }] };
        const { site, warnings } = buildSite(config, getTheme('modern'));
        const [hero, stats, programs] = site.pages[0].sections;

        assert.equal(hero.variant, 'centered');
        assert.equal(stats.variant, undefined);
        assert.equal(programs.variant, 'cards');
        assert.match(warnings.join('\n'), /variant "sparkly" is not offered by "stats"/);
    });

    it('lists used components', () => {
        const { site } = buildSite(example(), getTheme('classic'));

        assert.ok(usedComponents(site).includes('article'));
        assert.ok(!usedComponents(site).includes('rich-text'));
    });

    it('slugifies titles', () => {
        assert.equal(slugify('  Ädmissions Open: 2027!  '), 'admissions-open-2027');
    });
});

describe('themes', () => {
    it('ships at least four complete themes', () => {
        const themes = listThemes();

        assert.ok(themes.length >= 4);

        for (const theme of themes) {
            for (const key of ['primary', 'secondary', 'accent', 'background', 'foreground', 'muted', 'surface', 'border']) {
                assert.ok(theme.tokens.colors[key], `${theme.name} defines ${key}`);
            }

            for (const [type, variant] of Object.entries(theme.variants)) {
                const component = listComponents().find((item) => item.name === type);

                assert.ok(component, `${theme.name} references component ${type}`);
                assert.ok(component.variants.includes(variant), `${theme.name}: ${type} offers ${variant}`);
            }
        }
    });

    it('keeps theme text colours readable', () => {
        for (const theme of listThemes()) {
            const colors = resolveColors(theme, {});

            assert.ok(contrastRatio(colors.foreground, colors.background) >= 7, `${theme.name} body text`);
            assert.ok(contrastRatio(colors.mutedForeground, colors.background) >= 4.5, `${theme.name} muted text`);
            assert.ok(contrastRatio(colors.primary, colors.primaryForeground) >= 4.5, `${theme.name} primary button`);
            assert.ok(contrastRatio(colors.accentStrong, colors.background) >= 4.5, `${theme.name} accent text`);
        }
    });

    it('derives readable foregrounds for brand colour overrides', () => {
        const colors = resolveColors(getTheme('classic'), { colors: { primary: '#ffd60a', accent: '#003049' } });

        assert.equal(colors.primary, '#ffd60a');
        assert.equal(colors.primaryForeground, '#111827');
        assert.equal(colors.accentForeground, '#ffffff');
    });

    it('generates Tailwind theme tokens and font imports', () => {
        const css = buildThemeCss(getTheme('playful'), { fonts: { body: 'Lexend' } });

        assert.match(css, /@theme \{/);
        assert.match(css, /--color-primary: #6d28d9;/);
        assert.match(css, /--font-body: Lexend, system-ui, sans-serif;/);
        assert.match(css, /--radius-card: 1\.75rem;/);
        assert.match(css, /\.theme-playful \.school-card/);
        assert.equal(
            googleFontsUrl({ heading: { family: 'Plus Jakarta Sans', weights: [700] }, body: { family: 'Plus Jakarta Sans', weights: [400, 700] } }),
            'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap',
        );
    });
});

describe('machine-readable commands', () => {
    it('describes the registry with resolved theme tokens', async () => {
        const { describeRegistry } = await import('../src/commands/inspect.js');
        const registry = describeRegistry();
        const modern = registry.themes.find((theme) => theme.name === 'modern');

        assert.equal(modern.tokens.cssVariables['--color-primary'], '#1d4ed8');
        assert.equal(modern.extends, null);
        assert.ok(registry.components.some((component) => component.name === 'hero' && component.variants.includes('split')));
        assert.deepEqual(
            registry.targets.map((target) => target.name),
            ['nextjs', 'laravel-inertia-react'],
        );
    });

    it('returns site data and tokens for a valid config, and errors otherwise', async () => {
        const { previewData } = await import('../src/commands/inspect.js');
        const ok = previewData({ ...example(), colors: { primary: '#7f1d1d' } });

        assert.equal(ok.ok, true);
        assert.equal(ok.tokens.cssVariables['--color-primary'], '#7f1d1d');
        assert.ok(ok.site.pages.some((page) => page.slug === '/about'));

        const bad = previewData({ school: {} });
        assert.equal(bad.ok, false);
        assert.match(bad.errors.join('\n'), /school\.name is required/);
    });

    it('prints JSON from the CLI, reading the config from stdin', async () => {
        const { execFileSync } = await import('node:child_process');
        const output = execFileSync(process.execPath, [path.join(ROOT, 'bin', 'schoolforge.js'), 'preview', '-c', '-'], { input: JSON.stringify(minimal()) });

        assert.equal(JSON.parse(output).ok, true);
    });
});

describe('seo settings', () => {
    it('normalises the site URL and falls back to the hero image or logo', () => {
        const { site } = buildSite({ ...minimal(), seo: { siteUrl: 'https://school.edu.np/', keywords: ['school'] }, school: { name: 'S', logo: '/logo.png' } }, getTheme('classic'));

        assert.deepEqual(site.seo, { siteUrl: 'https://school.edu.np', image: '/logo.png', keywords: ['school'], googleSiteVerification: null });
    });

    it('rejects relative site URLs', () => {
        assert.match(validateConfig({ ...minimal(), seo: { siteUrl: 'school.edu.np' } }).join('\n'), /seo\.siteUrl must be a full URL/);
    });
});
