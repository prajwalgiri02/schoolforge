import fs from 'node:fs';
import path from 'node:path';
import { buildSite, validateConfig } from '../lib/config.js';
import { exists, readJson, writeFile, writeJson } from '../lib/fsutil.js';
import { COMPONENTS_DIR, THEMES_DIR } from '../lib/paths.js';
import { getTheme, listComponents, listThemes, NAME_PATTERN } from '../lib/registry.js';
import { listTargets } from '../lib/targets/index.js';

export function list({ what, log = console.log }) {
    if (what === 'themes') {
        for (const theme of listThemes()) {
            log(`${theme.name.padEnd(14)} ${theme.label}${theme.extends ? ` (extends ${theme.extends})` : ''}`);
            log(`${''.padEnd(14)} ${theme.description}`);
        }

        return;
    }

    if (what === 'components') {
        for (const component of listComponents()) {
            const variants = component.variants.length > 0 ? ` [${component.variants.join(', ')}]` : '';
            log(`${component.name.padEnd(18)} ${component.label}${variants}`);
        }

        return;
    }

    if (what === 'targets') {
        for (const target of listTargets()) {
            log(`${target.name.padEnd(22)} ${target.label}`);
        }

        return;
    }

    throw new Error('Usage: schoolforge list themes|components|targets');
}

/**
 * Scaffolds a new theme that extends an existing one, so it starts working
 * immediately and the author only changes the tokens and variants they care about.
 */
export function newTheme({ name, from = 'classic', label, log = console.log }) {
    if (!name || !NAME_PATTERN.test(name)) {
        throw new Error('Theme name must be kebab-case, e.g. "sunrise" or "royal-blue".');
    }

    const dir = path.join(THEMES_DIR, name);

    if (exists(dir)) {
        throw new Error(`Theme "${name}" already exists at ${dir}.`);
    }

    const base = getTheme(from);

    if (!base) {
        throw new Error(`Base theme "${from}" not found.`);
    }

    writeJson(path.join(dir, 'theme.json'), {
        extends: from,
        label: label ?? name.replace(/(^|-)([a-z])/g, (_, dash, char) => `${dash ? ' ' : ''}${char.toUpperCase()}`),
        description: `Custom theme based on ${base.label}.`,
        tokens: {
            colors: {
                primary: base.tokens.colors.primary,
                secondary: base.tokens.colors.secondary,
                accent: base.tokens.colors.accent,
            },
        },
        variants: {
            hero: base.variants.hero,
            navbar: base.variants.navbar,
        },
    });
    writeFile(
        path.join(dir, 'extra.css'),
        `/* Optional CSS for the ${name} theme. Scope rules with .theme-${name} so they only apply here. */\n`,
    );
    fs.mkdirSync(path.join(dir, 'components'), { recursive: true });
    writeFile(
        path.join(dir, 'components', 'README.md'),
        `Put a folder here named after a registry component (e.g. \`hero/index.tsx\`) to replace that component\nwhenever the ${name} theme is used. Copy the original from registry/components/<name>/ as a starting point.\n`,
    );

    log(`Created theme "${name}" in ${path.relative(process.cwd(), dir)}`);
    log('  Edit theme.json to change colours, fonts, radius and section variants.');

    return dir;
}

export function newComponent({ name, variants = ['default'], label, log = console.log }) {
    if (!name || !NAME_PATTERN.test(name)) {
        throw new Error('Component name must be kebab-case, e.g. "sports-highlights".');
    }

    const dir = path.join(COMPONENTS_DIR, name);

    if (exists(dir)) {
        throw new Error(`Component "${name}" already exists at ${dir}.`);
    }

    const title = label ?? name.replace(/(^|-)([a-z])/g, (_, dash, char) => `${dash ? ' ' : ''}${char.toUpperCase()}`);
    const componentName = name.replace(/(^|-)([a-z])/g, (_, _dash, char) => char.toUpperCase());

    writeJson(path.join(dir, 'component.json'), {
        name,
        label: title,
        description: `${title} section.`,
        category: 'section',
        variants,
        requires: [],
        files: ['index.tsx'],
    });
    writeFile(
        path.join(dir, 'index.tsx'),
        `import { Container, Section, SectionHeading } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

type ${componentName}Props = SectionProps<{ items?: { title: string; description?: string }[] }>;

/**
 * ${title}. Use it in school.config.json with { "type": "${name}" }.
 * Section fields (title, subtitle, items...) arrive on \`section\`; school data lives on \`site\`.
 */
export default function ${componentName}({ section, site }: ${componentName}Props) {
    const variant = section.variant ?? '${variants[0]}';
    const items = section.items ?? [];

    return (
        <Section tone="default" className={\`variant-\${variant}\`}>
            <Container>
                <SectionHeading eyebrow={section.eyebrow ?? site.school.shortName} title={section.title ?? '${title}'} subtitle={section.subtitle} />
                <div className="grid gap-6 md:grid-cols-3">
                    {items.map((item) => (
                        <article key={item.title} className="school-card p-6">
                            <h3 className="school-heading text-lg">{item.title}</h3>
                            {item.description && <p className="mt-2 text-muted-foreground">{item.description}</p>}
                        </article>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
`,
    );

    log(`Created component "${name}" in ${path.relative(process.cwd(), dir)}`);
    log(`  Use it in a page: { "type": "${name}", "title": "...", "items": [...] }, then run \`schoolforge sync\` in your project.`);

    return dir;
}

export function validate({ configFile, log = console.log }) {
    const config = readJson(path.resolve(configFile));
    const errors = validateConfig(config, { components: new Set(listComponents().map((component) => component.name)) });

    if (errors.length > 0) {
        throw new Error(`${configFile} has ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
    }

    const { site, warnings } = buildSite(config, getTheme(config.theme ?? 'classic'));

    for (const warning of warnings) {
        log(`  warning: ${warning}`);
    }

    log(`${configFile} is valid: ${site.pages.length} pages (${site.pages.map((page) => page.slug).join(', ')})`);

    return { site, warnings };
}
