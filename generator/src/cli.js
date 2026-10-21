import path from 'node:path';
import { parseArgs } from 'node:util';
import { createProject, help as createHelp } from './commands/create.js';
import { init } from './commands/init.js';
import { describeRegistry, previewData, printJson, readConfigArgument } from './commands/inspect.js';
import { add, remove, sync, upgrade, useTheme } from './commands/manage.js';
import { list, newComponent, newTheme, validate } from './commands/registry.js';
import { GENERATOR_VERSION } from './lib/project.js';

const HELP = `SchoolForge ${GENERATOR_VERSION}: generate themeable school websites

Usage: schoolforge <command> [options]

Create
  init [file]                         Answer a few questions and write a school config
  create <dir> -c <config>            Generate a new Next.js or Laravel + Inertia codebase
  validate <config>                   Check a config without generating anything

Inside a generated project (or pass --project <dir>)
  sync [--force]                      Regenerate site data and theme and update components
  upgrade [--force]                   Update an older project to this SchoolForge version
  add <component...> [--page /slug]   Install components (optionally append to a page)
  remove <component...>               Uninstall components and remove their sections
  use-theme <theme>                   Switch the project to another theme

Registry
  list themes|components|targets      Show what is available
  new theme <name> [--from classic]   Scaffold a theme that extends another
  new component <name> [--variants a,b]  Scaffold a section component

Machine-readable (JSON on stdout, used by SchoolForge Studio)
  inspect                             Themes (with resolved tokens), components and targets
  preview [-c <config> | -c -]        Validate a config and print site data + design tokens

${createHelp}`;

const options = {
    config: { type: 'string', short: 'c' },
    target: { type: 'string' },
    theme: { type: 'string' },
    project: { type: 'string', short: 'p' },
    page: { type: 'string' },
    variant: { type: 'string' },
    variants: { type: 'string' },
    from: { type: 'string' },
    label: { type: 'string' },
    'skip-install': { type: 'boolean' },
    build: { type: 'boolean' },
    force: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
};

export async function main(argv) {
    const { values, positionals } = parseArgs({ args: argv, options, allowPositionals: true });
    const [command, ...rest] = positionals;
    const projectDir = path.resolve(values.project ?? '.');

    if (values.version) {
        console.log(GENERATOR_VERSION);

        return;
    }

    if (!command || values.help || command === 'help') {
        console.log(HELP);

        return;
    }

    switch (command) {
        case 'init':
            await init({ file: rest[0] });
            break;
        case 'create':
            createProject({
                directory: rest[0],
                configFile: values.config,
                target: values.target,
                theme: values.theme,
                skipInstall: values['skip-install'],
                build: values.build,
                force: values.force,
            });
            break;
        case 'validate':
            validate({ configFile: rest[0] ?? values.config ?? 'school.config.json' });
            break;
        case 'sync':
            sync({ projectDir, force: values.force });
            break;
        case 'upgrade':
            upgrade({ projectDir, force: values.force });
            break;
        case 'add':
            add({ projectDir, names: rest, page: values.page, variant: values.variant });
            break;
        case 'remove':
            remove({ projectDir, names: rest });
            break;
        case 'use-theme':
            useTheme({ projectDir, name: rest[0] });
            break;
        case 'inspect':
            printJson(describeRegistry());
            break;
        case 'preview':
            printJson(previewData(readConfigArgument(values.config ?? rest[0])));
            break;
        case 'list':
            list({ what: rest[0] });
            break;
        case 'new':
            if (rest[0] === 'theme') {
                newTheme({ name: rest[1], from: values.from, label: values.label });
            } else if (rest[0] === 'component') {
                newComponent({ name: rest[1], label: values.label, variants: values.variants ? values.variants.split(',').map((item) => item.trim()) : undefined });
            } else {
                throw new Error('Usage: schoolforge new theme|component <name>');
            }
            break;
        default:
            throw new Error(`Unknown command "${command}". Run \`schoolforge help\`.`);
    }
}
