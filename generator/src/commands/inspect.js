import fs from 'node:fs';
import path from 'node:path';
import { buildSite, resolveTokens, validateConfig } from '../lib/config.js';
import { readJson } from '../lib/fsutil.js';
import { getTheme, listComponents, listThemes } from '../lib/registry.js';
import { listTargets } from '../lib/targets/index.js';

/**
 * Machine-readable commands used by SchoolForge Studio (and any other tool)
 * to drive the generator. Both print a single JSON document to stdout.
 */

export function readConfigArgument(configFile) {
    if (!configFile || configFile === '-') {
        const input = fs.readFileSync(0, 'utf8');

        try {
            return JSON.parse(input);
        } catch (error) {
            throw new Error(`Could not parse config JSON from stdin: ${error.message}`);
        }
    }

    return readJson(path.resolve(configFile));
}

export function describeRegistry() {
    return {
        themes: listThemes().map((theme) => ({
            name: theme.name,
            label: theme.label,
            description: theme.description,
            extends: theme.extends ?? null,
            variants: theme.variants,
            tokens: resolveTokens(theme, {}),
            ownTokens: readJson(path.join(theme.dir, 'theme.json')),
            overrides: Object.keys(theme.componentOverrides),
        })),
        components: listComponents().map(({ name, label, description, category, variants, requires }) => ({ name, label, description, category, variants, requires })),
        targets: listTargets().map(({ name, label }) => ({ name, label })),
    };
}

/**
 * Validates a config and, when valid, returns the site data and resolved design
 * tokens exactly as a generated project would render them.
 */
export function previewData(config, locale = null) {
    const components = new Set(listComponents().map((component) => component.name));
    const errors = validateConfig(config, { components });

    if (errors.length > 0) {
        return { ok: false, errors, warnings: [] };
    }

    const theme = getTheme(config.theme ?? 'classic');
    const { site, warnings } = buildSite(config, theme, { locale });

    return { ok: true, errors: [], warnings, site, tokens: resolveTokens(theme, config), extraCss: theme.extraCss };
}

export function printJson(data) {
    process.stdout.write(`${JSON.stringify(data)}\n`);
}
