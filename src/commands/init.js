import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { isHexColor } from '../lib/color.js';
import { TARGETS } from '../lib/config.js';
import { exists, readJson, writeJson } from '../lib/fsutil.js';
import { ROOT } from '../lib/paths.js';
import { listThemes } from '../lib/registry.js';

/**
 * Builds a config from answers. With `withSampleContent`, the example school's
 * programs, facilities, FAQs etc. are included as placeholders to edit.
 */
export function configFromAnswers(answers, { withSampleContent = false } = {}) {
    const sample = withSampleContent ? readJson(path.join(ROOT, 'examples', 'school.config.json')) : {};
    const { school: _school, target: _target, theme: _theme, colors: _colors, $schema: _schema, ...sampleContent } = sample;

    const config = {
        target: answers.target,
        theme: answers.theme,
        school: {
            name: answers.name,
            shortName: answers.shortName || undefined,
            tagline: answers.tagline || undefined,
            motto: answers.motto || undefined,
            type: answers.type || undefined,
            established: answers.established ? Number(answers.established) || answers.established : undefined,
            about: { summary: answers.summary || `${answers.name} is a community of curious learners and caring teachers.` },
            contact: {
                address: answers.address || undefined,
                phone: answers.phone ? [answers.phone] : undefined,
                email: answers.email ? [answers.email] : undefined,
            },
        },
        ...(answers.primary ? { colors: { primary: answers.primary, ...(answers.accent ? { accent: answers.accent } : {}) } } : {}),
        hero: {
            title: answers.tagline || `Welcome to ${answers.name}`,
            subtitle: answers.summary || undefined,
            primaryCta: { label: 'Apply for admission', href: '/admissions' },
            secondaryCta: { label: 'Contact us', href: '/contact' },
        },
        ...sampleContent,
    };

    return JSON.parse(JSON.stringify(config));
}

export async function init({ file = 'school.config.json', log = console.log }) {
    const output = path.resolve(file);

    if (exists(output)) {
        throw new Error(`${file} already exists. Pass a different file name: schoolforge init my-school.json`);
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const themes = listThemes();

    const ask = async (question, fallback = '') => {
        const answer = (await rl.question(fallback ? `${question} (${fallback}): ` : `${question}: `)).trim();

        return answer || fallback;
    };

    const askChoice = async (question, options, fallback) => {
        log(options.map((option, index) => `  ${index + 1}. ${option}`).join('\n'));

        for (;;) {
            const answer = await ask(question, fallback);
            const byIndex = options[Number(answer) - 1];

            if (byIndex || options.includes(answer)) {
                return byIndex ?? answer;
            }

            log(`  Please choose one of: ${options.join(', ')}`);
        }
    };

    const askColor = async (question) => {
        for (;;) {
            const answer = await ask(question);

            if (!answer || isHexColor(answer)) {
                return answer;
            }

            log('  Please enter a hex colour like #1b365d, or leave blank.');
        }
    };

    try {
        log('Let’s describe your school. Press enter to accept defaults or skip optional fields.\n');
        const answers = {};

        do {
            answers.name = await ask('School name (required)');
        } while (!answers.name);

        answers.shortName = await ask('Short name / acronym');
        answers.tagline = await ask('Tagline', 'Inspiring minds, shaping futures');
        answers.motto = await ask('Motto');
        answers.type = await ask('Type of school', 'Secondary School');
        answers.established = await ask('Year established');
        answers.summary = await ask('One or two sentences about the school');
        answers.address = await ask('Address');
        answers.phone = await ask('Phone');
        answers.email = await ask('Email');
        log('\nFramework:');
        answers.target = await askChoice('Choose a target', TARGETS, 'nextjs');
        log('\nThemes:');
        answers.theme = await askChoice(
            'Choose a theme',
            themes.map((theme) => theme.name),
            'classic',
        );
        answers.primary = await askColor('Brand primary colour (hex, blank keeps theme colour)');
        answers.accent = answers.primary ? await askColor('Brand accent colour (hex, optional)') : '';
        const sample = (await ask('Include sample programs, facilities, FAQs etc. to edit? (y/n)', 'y')).toLowerCase().startsWith('y');

        writeJson(output, configFromAnswers(answers, { withSampleContent: sample }));
        log(`\nWrote ${file}. Review it, then run:\n  schoolforge create my-school-site --config ${file}`);

        return output;
    } finally {
        rl.close();
    }
}
