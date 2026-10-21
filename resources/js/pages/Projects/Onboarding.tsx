import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Globe } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { Field, MediaLibraryUrlContext, UploadUrlContext } from '@admin/fields';
import type { FieldDefinition, Value } from '@admin/types';
import { FieldError, StudioLayout } from '@/studio/StudioLayout';
import type { ProjectSummary, ThemeSummary } from '@/studio/types';

type Values = {
    name: string;
    tagline: string;
    established: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    summary: string;
    principal_name: string;
    principal_message: string;
    theme: string;
    primary_color: string;
};

type Props = { project: ProjectSummary; themes: ThemeSummary[]; websiteUrl: string | null; values: Values };

const field = (name: keyof Values, type: FieldDefinition['type'], label: string, help?: string, required = false): FieldDefinition => ({ name, type, label, help, required });

const steps: { title: string; description: string; fields: FieldDefinition[] }[] = [
    {
        title: 'Your school',
        description: 'How your school’s name appears at the top of every page.',
        fields: [
            field('name', 'text', 'School name', undefined, true),
            field('tagline', 'text', 'Tagline', 'A short line under the name, e.g. “Learning with values since 1998”.'),
            field('established', 'text', 'Year established', 'e.g. 1998'),
            field('logo', 'image', 'Logo', 'A square or wide PNG works best. You can add it later.'),
        ],
    },
    {
        title: 'Contact details',
        description: 'Shown in the footer and on the Contact page, so parents can reach you.',
        fields: [field('address', 'text', 'Address'), field('phone', 'text', 'Phone'), field('email', 'text', 'Email')],
    },
    {
        title: 'About your school',
        description: 'The introduction on the home page and the principal’s welcome message.',
        fields: [
            field('summary', 'textarea', 'Short introduction', 'Two or three sentences about your school.'),
            field('principal_name', 'text', 'Principal’s name'),
            field('principal_message', 'textarea', 'Principal’s message', 'Separate paragraphs with a blank line.'),
        ],
    },
    { title: 'Look and feel', description: 'Pick a design and your school colour. You can change these any time.', fields: [] },
];

export default function Onboarding({ project, themes, websiteUrl, values }: Props) {
    const form = useForm<Values>(values);
    const [step, setStep] = useState(0);
    const current = steps[step];
    const last = step === steps.length - 1;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!last) {
            setStep(step + 1);

            return;
        }

        form.put(`/projects/${project.slug}/welcome`, {
            onError: (errors) => {
                const firstWithError = steps.findIndex((item, index) => (index === steps.length - 1 ? 'theme' in errors || 'primary_color' in errors : item.fields.some((definition) => definition.name in errors)));
                setStep(Math.max(0, firstWithError));
            },
        });
    };

    return (
        <StudioLayout title="Set up your website">
            <UploadUrlContext.Provider value="/uploads">
                <MediaLibraryUrlContext.Provider value="/media/library">
                    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
                        <p className="text-sm font-medium text-indigo-600">Welcome to SchoolForge</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Let’s set up {form.data.name || 'your school'}’s website</h1>
                        <p className="mt-2 text-sm text-zinc-500">
                            Your site already has pages for admissions, academics, news, gallery and more, filled with starter content. These steps add the details every school needs; you can edit everything else afterwards.
                        </p>
                        {websiteUrl && (
                            <p className="mt-3 flex items-start gap-2 text-sm text-zinc-600">
                                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                                <span>
                                    Your website will be at <span className="font-medium break-all">{websiteUrl}</span> once you publish it.
                                </span>
                            </p>
                        )}

                        <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Setup steps">
                            {steps.map((item, index) => (
                                <li key={item.title}>
                                    <button type="button" onClick={() => setStep(index)} aria-current={index === step ? 'step' : undefined} className="w-full text-left">
                                        <span className={`block h-1.5 rounded-full ${index <= step ? 'bg-indigo-600' : 'bg-zinc-200'}`} />
                                        <span className={`mt-2 hidden text-xs font-medium sm:block ${index === step ? 'text-zinc-900' : 'text-zinc-500'}`}>{item.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ol>

                        <form onSubmit={submit} className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Step {step + 1} of {steps.length}
                            </p>
                            <h2 className="mt-1 text-lg font-semibold">{current.title}</h2>
                            <p className="mt-1 text-sm text-zinc-500">{current.description}</p>

                            <div className="mt-6 space-y-5">
                                {current.fields.map((definition) => (
                                    <Field
                                        key={definition.name}
                                        field={definition}
                                        value={form.data[definition.name as keyof Values]}
                                        onChange={(value: Value) => form.setData(definition.name as keyof Values, typeof value === 'string' ? value : '')}
                                        path={definition.name}
                                        errors={form.errors}
                                        icons={[]}
                                    />
                                ))}

                                {last && (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {themes.map((theme) => {
                                                const selected = form.data.theme === theme.name;

                                                return (
                                                    <button
                                                        key={theme.name}
                                                        type="button"
                                                        onClick={() => form.setData('theme', theme.name)}
                                                        aria-pressed={selected}
                                                        className={`relative flex items-center gap-4 rounded-xl border-2 bg-white p-3 text-left transition ${selected ? 'border-indigo-600 ring-4 ring-indigo-100' : 'border-zinc-200 hover:border-zinc-300'}`}
                                                    >
                                                        <span className="grid h-12 w-12 shrink-0 grid-cols-2 overflow-hidden rounded-lg" aria-hidden="true">
                                                            {['primary', 'accent', 'secondary', 'background'].map((key) => (
                                                                <span key={key} style={{ background: theme.colors[key] }} />
                                                            ))}
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block font-medium">{theme.label}</span>
                                                            <span className="block text-xs text-zinc-500">{theme.description}</span>
                                                        </span>
                                                        {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-indigo-600" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <FieldError message={form.errors.theme} />
                                        <div>
                                            <label htmlFor="primary_color" className="mb-1.5 block text-sm font-medium text-zinc-800">
                                                School colour
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    aria-label="School colour picker"
                                                    value={/^#[0-9a-fA-F]{6}$/.test(form.data.primary_color) ? form.data.primary_color : (themes.find((theme) => theme.name === form.data.theme)?.colors.primary ?? '#1b365d')}
                                                    onChange={(event) => form.setData('primary_color', event.target.value)}
                                                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
                                                />
                                                <input id="primary_color" value={form.data.primary_color} placeholder="Theme default" onChange={(event) => form.setData('primary_color', event.target.value)} className={`${inputClass} font-mono`} />
                                            </div>
                                            <p className="mt-1.5 text-xs text-zinc-500">Leave empty to use the theme’s colour. Text colours adjust automatically so they stay readable.</p>
                                            <FieldError message={form.errors.primary_color} />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5">
                                {step > 0 ? (
                                    <button type="button" onClick={() => setStep(step - 1)} className={buttonClass.secondary}>
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </button>
                                ) : (
                                    <Link href={`/projects/${project.slug}/content`} className="text-sm text-zinc-500 hover:text-zinc-900">
                                        Skip for now
                                    </Link>
                                )}
                                <button type="submit" disabled={form.processing} className={buttonClass.primary}>
                                    {last ? (
                                        <>
                                            <Check className="h-4 w-4" /> {form.processing ? 'Saving…' : 'Finish setup'}
                                        </>
                                    ) : (
                                        <>
                                            Next <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </main>
                </MediaLibraryUrlContext.Provider>
            </UploadUrlContext.Provider>
        </StudioLayout>
    );
}
