import fs from 'node:fs';
import path from 'node:path';
import { GENERATOR_VERSION, readProjectConfig, requireProject, syncProject, writeProjectConfig } from '../lib/project.js';
import { getComponent, getTheme, listThemes } from '../lib/registry.js';
import { getTarget } from '../lib/targets/index.js';

function report(result, log) {
    for (const warning of result.warnings) {
        log(`  warning: ${warning}`);
    }

    log(`  ${result.written.length} written, ${result.unchanged.length} unchanged, ${result.removed.length} removed, ${result.skipped.length} kept with local edits`);
    log(`  ${result.site.pages.length} pages · components: ${[...result.components, ...result.custom.map((name) => `${name} (custom)`)].join(', ')}`);
}

export function sync({ projectDir, force = false, log = console.log }) {
    requireProject(projectDir);
    const config = readProjectConfig(projectDir);
    log(`Syncing ${path.basename(projectDir)}`);
    const result = syncProject(projectDir, { config, force, log });
    report(result, log);

    return result;
}

/**
 * Brings an existing project up to the installed SchoolForge version: components,
 * runtime and app files (controllers, routes, migrations...) are updated unless
 * they were edited locally, then the steps to finish the upgrade are listed.
 */
export function upgrade({ projectDir, force = false, log = console.log }) {
    const lock = requireProject(projectDir);
    log(`Upgrading ${path.basename(projectDir)} from SchoolForge ${lock.version ?? 'unknown'} to ${GENERATOR_VERSION}`);
    const result = syncProject(projectDir, { config: readProjectConfig(projectDir), force, log });
    report(result, log);

    const steps =
        lock.target === 'laravel-inertia-react'
            ? ['composer install', 'npm install', 'php artisan migrate', 'npm run build', 'restart `php artisan inertia:start-ssr` and your queue worker']
            : ['npm install', 'npm run build'];

    log('\nFinish the upgrade:');

    for (const step of steps) {
        log(`  ${step}`);
    }

    if (result.skipped.length > 0) {
        log(`\n${result.skipped.length} file(s) you edited were left as they are. Compare them with a fresh project if something looks off, or rerun with --force to replace them.`);
    }

    return result;
}

/**
 * Installs components into the project. With `page`, also appends a section using
 * each component to that page so it shows up immediately.
 */
export function add({ projectDir, names, page, variant, log = console.log }) {
    const target = getTarget(requireProject(projectDir).target);

    if (names.length === 0) {
        throw new Error('Usage: schoolforge add <component...> [--page /slug] [--variant name]');
    }

    const config = readProjectConfig(projectDir);

    for (const name of names) {
        if (!getComponent(name)) {
            throw new Error(`Component "${name}" is not in the registry. See \`schoolforge list components\`, or build one in ${target.schoolDir}/custom/${name}/.`);
        }
    }

    if (page) {
        const pages = config.pages ?? (config.pages = materializePages(projectDir));
        const entry = pages.find((item) => item.slug === page);

        if (!entry) {
            throw new Error(`Page "${page}" not found. Pages: ${pages.map((item) => item.slug).join(', ')}`);
        }

        for (const name of names) {
            entry.sections.push(variant ? { type: name, variant } : { type: name });
        }

        writeProjectConfig(projectDir, config);
        log(`Added ${names.join(', ')} to page ${page}`);
    }

    const result = syncProject(projectDir, { config, extraComponents: names, log });
    report(result, log);

    return result;
}

/**
 * Uninstalls components and strips every section that uses them from the config.
 */
export function remove({ projectDir, names, log = console.log }) {
    requireProject(projectDir);

    if (names.length === 0) {
        throw new Error('Usage: schoolforge remove <component...>');
    }

    const config = readProjectConfig(projectDir);
    const drop = new Set(names);
    config.pages = (config.pages ?? materializePages(projectDir)).map((page) => ({ ...page, sections: page.sections.filter((section) => !drop.has(section.type)) }));
    config.layout = Object.fromEntries(Object.entries(config.layout ?? materializeLayout(projectDir)).map(([slot, sections]) => [slot, sections.filter((section) => !drop.has(section.type))]));
    writeProjectConfig(projectDir, config);
    log(`Removed ${names.join(', ')} from all pages`);

    const result = syncProject(projectDir, { config, dropComponents: names, log });
    report(result, log);

    return result;
}

export function useTheme({ projectDir, name, log = console.log }) {
    requireProject(projectDir);

    if (!getTheme(name)) {
        throw new Error(`Unknown theme "${name}". Available: ${listThemes().map((theme) => theme.name).join(', ')}`);
    }

    const config = readProjectConfig(projectDir);
    config.theme = name;
    writeProjectConfig(projectDir, config);
    log(`Switched to theme ${getTheme(name).label}`);

    const result = syncProject(projectDir, { config, log });
    report(result, log);

    return result;
}

/**
 * Copies the generated pages (minus auto-generated article pages) into the config
 * so they can be edited explicitly.
 */
function materializePages(projectDir) {
    const target = getTarget(requireProject(projectDir).target);
    const site = readSite(projectDir, target);

    return site.pages
        .filter((page) => !page.sections.some((section) => section.type === 'article'))
        .map((page) => ({ ...page, sections: page.sections.map(({ variant, ...section }) => (variant && variant !== site.theme.variants[section.type] ? { ...section, variant } : section)) }));
}

function materializeLayout(projectDir) {
    const target = getTarget(requireProject(projectDir).target);

    return Object.fromEntries(Object.entries(readSite(projectDir, target).layout).map(([slot, sections]) => [slot, sections.map(({ variant: _variant, ...section }) => section)]));
}

function readSite(projectDir, target) {
    const file = path.join(projectDir, target.siteDataFile);

    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        throw new Error(`Could not read ${file}. Run \`schoolforge sync\` first.`);
    }
}
