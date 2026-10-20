import fs from 'node:fs';
import path from 'node:path';
import { COMPONENTS_DIR, PRESETS_DIR, THEMES_DIR } from './paths.js';
import { exists, listFiles, readJson } from './fsutil.js';

export const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merges plain objects. Arrays and scalars from `override` replace those in `base`.
 */
export function deepMerge(base, override) {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override === undefined ? base : override;
    }

    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
        result[key] = key in base ? deepMerge(base[key], value) : value;
    }

    return result;
}

export function listComponents() {
    if (!exists(COMPONENTS_DIR)) {
        return [];
    }

    return fs
        .readdirSync(COMPONENTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && exists(path.join(COMPONENTS_DIR, entry.name, 'component.json')))
        .map((entry) => getComponent(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export function getComponent(name) {
    const dir = path.join(COMPONENTS_DIR, name);
    const manifestFile = path.join(dir, 'component.json');

    if (!exists(manifestFile)) {
        return null;
    }

    const manifest = readJson(manifestFile);

    return {
        variants: [],
        requires: [],
        category: 'section',
        ...manifest,
        name,
        dir,
        files: manifest.files ?? listFiles(dir).filter((file) => file !== 'component.json'),
    };
}

export function listThemes() {
    if (!exists(THEMES_DIR)) {
        return [];
    }

    return fs
        .readdirSync(THEMES_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && exists(path.join(THEMES_DIR, entry.name, 'theme.json')))
        .map((entry) => getTheme(entry.name))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Loads a theme, resolving its `extends` chain so new themes only declare what they change.
 * Component overrides in `themes/<name>/components/<component>/` are collected along the chain,
 * with the most specific theme winning.
 */
export function getTheme(name, seen = new Set()) {
    const dir = path.join(THEMES_DIR, name);
    const file = path.join(dir, 'theme.json');

    if (!exists(file)) {
        return null;
    }

    if (seen.has(name)) {
        throw new Error(`Theme "${name}" has a circular "extends" chain.`);
    }

    seen.add(name);
    const own = readJson(file);
    const parent = own.extends ? getTheme(own.extends, seen) : null;

    if (own.extends && !parent) {
        throw new Error(`Theme "${name}" extends unknown theme "${own.extends}".`);
    }

    const { extends: _ignored, ...ownWithoutExtends } = own;
    const merged = parent ? deepMerge(stripRuntime(parent), ownWithoutExtends) : ownWithoutExtends;
    const overrides = { ...(parent?.componentOverrides ?? {}) };
    const overridesDir = path.join(dir, 'components');

    if (exists(overridesDir)) {
        for (const entry of fs.readdirSync(overridesDir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                overrides[entry.name] = { theme: name, dir: path.join(overridesDir, entry.name) };
            }
        }
    }

    const extraCss = [parent?.extraCss, readOptional(path.join(dir, 'extra.css'))].filter(Boolean).join('\n');

    return {
        label: name,
        description: '',
        variants: {},
        ...merged,
        name,
        dir,
        componentOverrides: overrides,
        extraCss,
    };
}

function stripRuntime(theme) {
    const { name: _name, dir: _dir, componentOverrides: _overrides, extraCss: _css, ...rest } = theme;

    return rest;
}

function readOptional(file) {
    return exists(file) ? fs.readFileSync(file, 'utf8') : '';
}

export function getPreset(name) {
    const file = path.join(PRESETS_DIR, `${name}.json`);

    if (!exists(file)) {
        throw new Error(`Unknown preset "${name}".`);
    }

    return readJson(file);
}
