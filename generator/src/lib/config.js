import { contrastRatio, ensureContrast, isHexColor, normalizeHex, readableOn } from './color.js';
import { deepMerge, getComponent, getPreset, getTheme, listThemes } from './registry.js';
import { readJson } from './fsutil.js';

export const TARGETS = ['nextjs', 'laravel-inertia-react'];

export const CONTENT_KEYS = [
    'hero',
    'announcement',
    'popup',
    'stats',
    'programs',
    'facilities',
    'faculty',
    'gallery',
    'albums',
    'videos',
    'campuses',
    'news',
    'events',
    'notices',
    'testimonials',
    'achievements',
    'admissions',
    'faqs',
];

const COLLECTION_KEYS = ['stats', 'programs', 'facilities', 'faculty', 'gallery', 'albums', 'videos', 'campuses', 'news', 'events', 'notices', 'testimonials', 'achievements', 'faqs'];

const COLLECTION_REQUIRED_FIELDS = {
    stats: ['label', 'value'],
    programs: ['name'],
    facilities: ['name'],
    faculty: ['name'],
    albums: ['title'],
    videos: ['title', 'url'],
    campuses: ['name'],
    news: ['title'],
    events: ['title', 'date'],
    notices: ['title'],
    testimonials: ['quote', 'name'],
    achievements: ['title'],
    faqs: ['question', 'answer'],
};

const COLOR_KEYS = ['primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground', 'background', 'foreground', 'muted', 'mutedForeground', 'surface', 'border'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function loadConfig(file) {
    return readJson(file);
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const SLUGGED_COLLECTIONS = { news: 'article', albums: 'album' };

/**
 * News and albums with their URL slug filled in: the given one, else one made
 * from the title, else "article-2" for titles without Latin letters.
 */
function withSlugs(items, noun) {
    return items.map((item, index) => (isObject(item) ? { ...item, slug: item.slug || slugify(item.title ?? '') || `${noun}-${index + 1}` } : item));
}

export function slugify(value) {
    return String(value)
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

/**
 * Validates a school config and returns a list of human readable problems.
 * An empty list means the config can be generated.
 */
export function validateConfig(config, { components = null } = {}) {
    const errors = [];

    if (!isObject(config)) {
        return ['Config must be a JSON object.'];
    }

    if (config.target !== undefined && !TARGETS.includes(config.target)) {
        errors.push(`target must be one of: ${TARGETS.join(', ')} (got "${config.target}").`);
    }

    if (config.theme !== undefined && !getTheme(config.theme)) {
        errors.push(`theme "${config.theme}" does not exist. Available: ${listThemes().map((theme) => theme.name).join(', ')}.`);
    }

    if (!isObject(config.school)) {
        errors.push('school is required and must be an object.');
    } else if (typeof config.school.name !== 'string' || config.school.name.trim() === '') {
        errors.push('school.name is required.');
    }

    if (config.colors !== undefined) {
        if (!isObject(config.colors)) {
            errors.push('colors must be an object of hex colours.');
        } else {
            for (const [key, value] of Object.entries(config.colors)) {
                if (!COLOR_KEYS.includes(key)) {
                    errors.push(`colors.${key} is not a known colour token. Use: ${COLOR_KEYS.join(', ')}.`);
                } else if (!isHexColor(value)) {
                    errors.push(`colors.${key} must be a hex colour like #1b365d (got "${value}").`);
                }
            }
        }
    }

    for (const key of COLLECTION_KEYS) {
        const list = config[key];

        if (list === undefined) {
            continue;
        }

        if (!Array.isArray(list)) {
            errors.push(`${key} must be an array.`);
            continue;
        }

        list.forEach((item, index) => {
            if (!isObject(item)) {
                errors.push(`${key}[${index}] must be an object.`);

                return;
            }

            for (const field of COLLECTION_REQUIRED_FIELDS[key] ?? []) {
                if (item[field] === undefined || item[field] === '') {
                    errors.push(`${key}[${index}].${field} is required.`);
                }
            }

            for (const dateField of ['date', 'endDate', 'deadline']) {
                if (item[dateField] !== undefined && !ISO_DATE.test(String(item[dateField]))) {
                    errors.push(`${key}[${index}].${dateField} must use YYYY-MM-DD (got "${item[dateField]}").`);
                }
            }

            if (ISO_DATE.test(String(item.date)) && ISO_DATE.test(String(item.endDate)) && item.endDate < item.date) {
                errors.push(`${key}[${index}].endDate must not be before date.`);
            }
        });
    }

    for (const field of ['startDate', 'endDate']) {
        if (config.popup?.[field] !== undefined && !ISO_DATE.test(String(config.popup[field]))) {
            errors.push(`popup.${field} must use YYYY-MM-DD (got "${config.popup[field]}").`);
        }
    }

    if (config.admissions?.deadline !== undefined && !ISO_DATE.test(String(config.admissions.deadline))) {
        errors.push(`admissions.deadline must use YYYY-MM-DD (got "${config.admissions.deadline}").`);
    }

    const languages = config.languages ?? ['en'];

    if (!Array.isArray(languages) || languages.length === 0 || languages.some((code) => typeof code !== 'string' || !/^[a-z]{2}$/.test(code))) {
        errors.push('languages must be a list of two-letter language codes, e.g. ["en", "ne"]. The first is the default.');
    } else if (new Set(languages).size !== languages.length) {
        errors.push('languages must not repeat a language.');
    } else {
        for (const code of Object.keys(config.translations ?? {})) {
            if (!languages.includes(code)) {
                errors.push(`translations.${code} is for a language that is not listed in languages.`);
            } else if (code === languages[0]) {
                errors.push(`translations.${code} is the default language; put that content at the top level instead.`);
            }
        }

        for (const [code, calendar] of Object.entries(config.calendars ?? {})) {
            if (!['ad', 'bs'].includes(calendar)) {
                errors.push(`calendars.${code} must be "ad" or "bs".`);
            }
        }
    }

    if (config.seo !== undefined) {
        if (!isObject(config.seo)) {
            errors.push('seo must be an object.');
        } else {
            if (config.seo.siteUrl !== undefined && !/^https?:\/\/[^\s/]+/.test(String(config.seo.siteUrl))) {
                errors.push(`seo.siteUrl must be a full URL such as https://www.myschool.edu.np (got "${config.seo.siteUrl}").`);
            }

            if (config.seo.keywords !== undefined && !Array.isArray(config.seo.keywords)) {
                errors.push('seo.keywords must be an array of strings.');
            }
        }
    }

    for (const [key, noun] of Object.entries(SLUGGED_COLLECTIONS)) {
        if (Array.isArray(config[key])) {
            const slugs = withSlugs(config[key], noun).map((item) => item?.slug);
            const duplicate = slugs.find((slug, index) => slugs.indexOf(slug) !== index);

            if (duplicate) {
                errors.push(`${key} slug "${duplicate}" is used more than once. Give each ${noun} a unique "slug".`);
            }
        }
    }

    (Array.isArray(config.albums) ? config.albums : []).forEach((album, index) => {
        if (album?.photos !== undefined && (!Array.isArray(album.photos) || album.photos.some((photo) => !isObject(photo)))) {
            errors.push(`albums[${index}].photos must be a list of photos like { "src": "...", "caption": "..." }.`);
        }
    });

    (Array.isArray(config.news) ? config.news : []).forEach((item, index) => {
        if (item?.tags !== undefined && (!Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== 'string'))) {
            errors.push(`news[${index}].tags must be a list of words, e.g. ["sports", "awards"].`);
        }
    });

    (Array.isArray(config.videos) ? config.videos : []).forEach((video, index) => {
        if (typeof video?.url === 'string' && !/^https?:\/\//.test(video.url)) {
            errors.push(`videos[${index}].url must be a full link such as https://www.youtube.com/watch?v=... (got "${video.url}").`);
        }
    });

    if (config.pages !== undefined) {
        if (!Array.isArray(config.pages) || config.pages.length === 0) {
            errors.push('pages must be a non-empty array when provided.');
        } else {
            const slugs = new Set();

            config.pages.forEach((page, index) => {
                if (!isObject(page)) {
                    errors.push(`pages[${index}] must be an object.`);

                    return;
                }

                if (typeof page.slug !== 'string' || !/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/.test(page.slug)) {
                    errors.push(`pages[${index}].slug must look like "/" or "/about" (lowercase letters, numbers, dashes).`);
                } else if (slugs.has(page.slug)) {
                    errors.push(`pages[${index}].slug "${page.slug}" is duplicated.`);
                } else {
                    slugs.add(page.slug);
                }

                if (typeof page.title !== 'string' || page.title === '') {
                    errors.push(`pages[${index}].title is required.`);
                }

                if (!Array.isArray(page.sections)) {
                    errors.push(`pages[${index}].sections must be an array.`);
                } else {
                    page.sections.forEach((section, sectionIndex) => {
                        if (!isObject(section) || typeof section.type !== 'string') {
                            errors.push(`pages[${index}].sections[${sectionIndex}] needs a "type".`);
                        } else if (components && !components.has(section.type)) {
                            errors.push(`pages[${index}].sections[${sectionIndex}] uses unknown component "${section.type}".`);
                        }
                    });
                }
            });

            if (!slugs.has('/')) {
                errors.push('pages must include a home page with slug "/".');
            }
        }
    }

    return errors;
}

function hasValue(value) {
    if (value === undefined || value === null || value === '') {
        return false;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (typeof value === 'object') {
        return Object.keys(value).length > 0;
    }

    return true;
}

function readPath(site, dotted) {
    return dotted.split('.').reduce((value, key) => (value === undefined || value === null ? undefined : value[key]), site);
}

const STRUCTURAL_SECTIONS = new Set(['page-header', 'cta', 'rich-text']);

/**
 * Turns a school config plus its theme into the normalized site data that the
 * generated app renders. Pure: does not touch the filesystem except to read registry manifests.
 */
function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Lays a translation over content: objects merge key by key, lists of objects
 * merge item by item (so untranslated items and fields such as images are kept),
 * and anything else is replaced when the translation provides a value.
 * Mirrors TranslationMerger::merge() in the Laravel target.
 */
export function mergeTranslation(base, overlay) {
    if (overlay === undefined || overlay === null || overlay === '') {
        return base;
    }

    if (isPlainObject(base) && isPlainObject(overlay)) {
        const result = { ...base };

        for (const [key, value] of Object.entries(overlay)) {
            result[key] = mergeTranslation(base[key], value);
        }

        return result;
    }

    if (Array.isArray(base) && Array.isArray(overlay) && base.some(isPlainObject)) {
        return base.map((item, index) => mergeTranslation(item, overlay[index])).concat(overlay.slice(base.length));
    }

    return overlay;
}

export const DEFAULT_CALENDARS = { ne: 'bs' };

export function siteLanguages(config) {
    const languages = config.languages ?? ['en'];

    return { languages, defaultLocale: languages[0] };
}

/**
 * The config as seen in one language: its translation laid over the default content.
 */
export function localizedConfig(config, locale) {
    const { defaultLocale } = siteLanguages(config);

    if (!locale || locale === defaultLocale) {
        return config;
    }

    const { pages: _pages, navigation, ...translation } = config.translations?.[locale] ?? {};
    const slugged = { ...config };

    // Pin slugs to the default language so /ne/news/<slug> matches /news/<slug>.
    for (const [key, noun] of Object.entries(SLUGGED_COLLECTIONS)) {
        if (Array.isArray(config[key])) {
            slugged[key] = withSlugs(config[key], noun);
        }
    }

    const localized = mergeTranslation(slugged, translation);

    return navigation ? { ...localized, navigation } : localized;
}

/**
 * Builds the site once per language. Returns { defaultLocale, sites: { code: site }, warnings }.
 */
export function buildSites(config, theme, options = {}) {
    const { languages, defaultLocale } = siteLanguages(config);
    const sites = {};
    let warnings = [];

    for (const locale of languages) {
        const result = buildSite(config, theme, { ...options, locale });
        sites[locale] = result.site;

        if (locale === defaultLocale) {
            warnings = result.warnings;
        }
    }

    return { defaultLocale, sites, warnings };
}

export function buildSite(originalConfig, theme, { resolveComponent = getComponent, locale } = {}) {
    const { languages, defaultLocale } = siteLanguages(originalConfig);
    const currentLocale = locale && languages.includes(locale) ? locale : defaultLocale;
    const config = localizedConfig(originalConfig, currentLocale);
    const pageTranslations = currentLocale === defaultLocale ? {} : (originalConfig.translations?.[currentLocale]?.pages ?? {});
    const preset = getPreset('default-site');
    const usingPreset = !config.pages && !theme.pages;
    const pageSource = structuredClone(config.pages ?? theme.pages ?? preset.pages);
    const layout = {
        ...deepMerge(preset.layout, theme.layout ?? {}),
        ...(config.layout ?? {}),
    };
    const variants = { ...(theme.variants ?? {}), ...(config.variants ?? {}) };
    const warnings = [];

    const content = {};

    for (const key of CONTENT_KEYS) {
        if (config[key] !== undefined) {
            content[key] = structuredClone(config[key]);
        }
    }

    for (const [key, noun] of Object.entries(SLUGGED_COLLECTIONS)) {
        if (content[key]) {
            content[key] = withSlugs(content[key], noun);
        }
    }

    const school = structuredClone(config.school);
    const lookup = { school, content };

    const resolveSection = (section, where) => {
        const component = resolveComponent(section.type);
        const resolved = { ...section };

        if (!resolved.variant && variants[section.type]) {
            resolved.variant = variants[section.type];
        }

        if (component && resolved.variant && component.variants.length > 0 && !component.variants.includes(resolved.variant)) {
            warnings.push(`${where}: variant "${resolved.variant}" is not offered by "${section.type}" (${component.variants.join(', ')}); the default is used.`);
            delete resolved.variant;
        }

        return { section: resolved, component };
    };

    const isSatisfied = (component) => !component || (component.requires ?? []).every((dotted) => hasValue(readPath(lookup, dotted)));

    const pages = [];

    for (const page of pageSource) {
        const sections = [];

        page.sections.forEach((raw, index) => {
            const { section, component } = resolveSection(raw, `${page.slug} section ${index + 1}`);

            if (usingPreset && !isSatisfied(component)) {
                return;
            }

            sections.push(section);
        });

        if (usingPreset && page.slug !== '/' && sections.every((section) => STRUCTURAL_SECTIONS.has(section.type))) {
            continue;
        }

        pages.push({ ...page, showInNav: page.showInNav !== false, sections });
    }

    const slugs = new Set(pages.map((page) => page.slug));

    for (const item of content.news ?? []) {
        const slug = `/news/${item.slug}`;

        if (hasValue(item.body) && !slugs.has(slug)) {
            pages.push({
                slug,
                title: item.title,
                description: item.excerpt,
                showInNav: false,
                sections: [{ type: 'article', newsSlug: item.slug }],
            });
        }
    }

    for (const album of content.albums ?? []) {
        const slug = `/gallery/${album.slug}`;

        if (!slugs.has(slug)) {
            pages.push({
                slug,
                title: album.title,
                description: album.description,
                showInNav: false,
                sections: [{ type: 'album', albumSlug: album.slug }],
            });
        }
    }

    const resolvedLayout = {
        header: (layout.header ?? []).map((section, index) => resolveSection(section, `layout header ${index + 1}`).section),
        footer: (layout.footer ?? []).map((section, index) => resolveSection(section, `layout footer ${index + 1}`).section),
    };

    for (const page of pages) {
        const translation = pageTranslations[page.slug] ?? {};

        Object.assign(page, Object.fromEntries(Object.entries(translation).filter(([key, value]) => ['title', 'navLabel', 'description'].includes(key) && value)));

        if (translation.title && !translation.navLabel && page.navLabel) {
            page.navLabel = translation.title;
        }
    }

    const navigation =
        config.navigation ??
        pages.filter((page) => page.showInNav && !page.slug.startsWith('/news/')).map((page) => ({ label: page.navLabel ?? page.title, href: page.slug }));

    const fontsUrl = googleFontsUrl(resolveFonts(theme, config));
    const site = {
        school,
        content,
        theme: {
            name: theme.name,
            label: theme.label,
            variants,
            fontImports: fontsUrl ? [fontsUrl] : [],
        },
        navigation,
        layout: resolvedLayout,
        pages,
        i18n: {
            locale: currentLocale,
            defaultLocale,
            locales: languages.map((code) => ({ code, label: code, basePath: code === defaultLocale ? '' : `/${code}` })),
            calendar: originalConfig.calendars?.[currentLocale] ?? DEFAULT_CALENDARS[currentLocale] ?? 'ad',
            basePath: currentLocale === defaultLocale ? '' : `/${currentLocale}`,
        },
        seo: {
            siteUrl: config.seo?.siteUrl ? String(config.seo.siteUrl).replace(/\/+$/, '') : null,
            image: config.seo?.image ?? content.hero?.image ?? school.logo ?? null,
            keywords: config.seo?.keywords ?? [],
            googleSiteVerification: config.seo?.googleSiteVerification ?? null,
        },
    };

    return { site, warnings };
}

/**
 * Lists every component type referenced by the site (layout + pages).
 */
export function usedComponents(site) {
    const names = new Set();

    for (const section of [...site.layout.header, ...site.layout.footer, ...site.pages.flatMap((page) => page.sections)]) {
        names.add(section.type);
    }

    return [...names].sort();
}

export function resolveFonts(theme, config) {
    const fonts = structuredClone(theme.tokens?.fonts ?? {});

    for (const role of ['heading', 'body']) {
        const override = config.fonts?.[role];

        if (typeof override === 'string') {
            fonts[role] = { family: override, fallback: fonts[role]?.fallback ?? 'system-ui, sans-serif', weights: [400, 500, 600, 700] };
        } else if (override && typeof override === 'object') {
            fonts[role] = { ...(fonts[role] ?? {}), ...override };
        }
    }

    return fonts;
}

export function googleFontsUrl(fonts) {
    const families = new Map();

    for (const font of Object.values(fonts)) {
        if (!font?.family || font.google === false) {
            continue;
        }

        const weights = families.get(font.family) ?? new Set();
        (font.weights ?? [400, 700]).forEach((weight) => weights.add(Number(weight)));
        families.set(font.family, weights);
    }

    if (families.size === 0) {
        return null;
    }

    const query = [...families.entries()]
        .map(([family, weights]) => `family=${family.trim().replace(/\s+/g, '+')}:wght@${[...weights].sort((a, b) => a - b).join(';')}`)
        .join('&');

    return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

function kebab(value) {
    return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/**
 * Resolves the final colour palette: theme colours, school overrides, then derived
 * foregrounds so text stays readable whatever brand colours a school picks.
 */
export function resolveColors(theme, config) {
    const colors = Object.fromEntries(Object.entries(theme.tokens?.colors ?? {}).map(([key, value]) => [key, normalizeHex(value)]));
    const overrides = config.colors ?? {};

    for (const [key, value] of Object.entries(overrides)) {
        colors[key] = normalizeHex(value);
    }

    for (const base of ['primary', 'secondary', 'accent']) {
        const foregroundKey = `${base}Foreground`;
        const baseOverridden = base in overrides;
        const foregroundUnreadable = colors[foregroundKey] && contrastRatio(colors[base], colors[foregroundKey]) < 3;

        if (!colors[foregroundKey] || (baseOverridden && !(foregroundKey in overrides) && foregroundUnreadable)) {
            colors[foregroundKey] = readableOn(colors[base]);
        }
    }

    colors.accentStrong = ensureContrast(colors.accent, colors.background, 4.5);

    return colors;
}

function quoteFamily(family) {
    return /\s/.test(family) ? `"${family}"` : family;
}

/**
 * Every design token a site uses, after theme inheritance and school overrides.
 * Also exposed as CSS custom properties, which is how live previews apply a theme.
 */
export function resolveTokens(theme, config) {
    const colors = resolveColors(theme, config);
    const fonts = resolveFonts(theme, config);
    const radius = { card: '0.75rem', button: '0.5rem', ...(theme.tokens?.radius ?? {}), ...(config.radius ?? {}) };
    const shadow = { card: '0 10px 30px -12px rgb(0 0 0 / 0.2)', ...(theme.tokens?.shadow ?? {}) };
    const heading = { weight: 700, tracking: '-0.01em', ...(theme.tokens?.heading ?? {}) };
    const cssVariables = {
        ...Object.fromEntries(Object.entries(colors).map(([key, value]) => [`--color-${kebab(key)}`, value])),
        ...Object.fromEntries(Object.entries(fonts).map(([role, font]) => [`--font-${role}`, [quoteFamily(font.family), font.fallback].filter(Boolean).join(', ')])),
        ...Object.fromEntries(Object.entries(radius).map(([key, value]) => [`--radius-${kebab(key)}`, value])),
        ...Object.fromEntries(Object.entries(shadow).map(([key, value]) => [`--shadow-${kebab(key)}`, value])),
    };

    return { colors, fonts, radius, shadow, heading, cssVariables };
}

export function buildThemeCss(theme, config) {
    const { cssVariables, heading } = resolveTokens(theme, config);

    const lines = [
        `/* Generated by SchoolForge from theme "${theme.name}". Edit school.config.json and run \`schoolforge sync\` instead of editing this file. */`,
        '',
        '@theme {',
        ...Object.entries(cssVariables).map(([name, value]) => `    ${name}: ${value};`),
        '}',
        '',
        ':root {',
        `    --school-heading-weight: ${heading.weight};`,
        `    --school-heading-tracking: ${heading.tracking};`,
        '}',
    ];

    if (theme.extraCss) {
        lines.push('', theme.extraCss.trim());
    }

    return `${lines.join('\n')}\n`;
}
