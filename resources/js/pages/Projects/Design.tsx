import { useForm } from '@inertiajs/react';
import { Check, RotateCcw, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { ProjectLayout } from '@/studio/ProjectLayout';
import { FieldError } from '@/studio/StudioLayout';
import type { ComponentSummary, ProjectSummary, ThemeSummary } from '@/studio/types';

type Design = {
    theme: string;
    colors: Record<string, string>;
    fonts: { heading: string | null; body: string | null };
    variants: Record<string, string>;
};

type Props = {
    project: ProjectSummary;
    themes: ThemeSummary[];
    themeDetails: Record<string, { colors: Record<string, string>; variants: Record<string, string> }>;
    components: ComponentSummary[];
    design: Design;
};

const colorTokens: { key: string; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'primaryForeground', label: 'Text on primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'secondaryForeground', label: 'Text on secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'accentForeground', label: 'Text on accent' },
    { key: 'background', label: 'Page background' },
    { key: 'foreground', label: 'Body text' },
    { key: 'muted', label: 'Muted background' },
    { key: 'mutedForeground', label: 'Muted text' },
    { key: 'surface', label: 'Cards' },
    { key: 'border', label: 'Borders' },
];

export default function DesignPage({ project, themes, themeDetails, components, design }: Props) {
    const form = useForm({
        theme: design.theme,
        colors: { ...design.colors } as Record<string, string>,
        fonts: { heading: design.fonts.heading ?? '', body: design.fonts.body ?? '' },
        variants: { ...design.variants } as Record<string, string>,
    });
    const errors = form.errors as Record<string, string | undefined>;
    const themeColors = themeDetails[form.data.theme]?.colors ?? {};
    const themeVariants = themeDetails[form.data.theme]?.variants ?? {};
    const selectedTheme = themes.find((theme) => theme.name === form.data.theme);

    const setColor = (key: string, value: string) => form.setData('colors', { ...form.data.colors, [key]: value });
    const clearColor = (key: string) => {
        const { [key]: _removed, ...rest } = form.data.colors;
        form.setData('colors', rest);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(`/projects/${project.slug}/design`, { preserveScroll: true });
    };

    return (
        <ProjectLayout project={project} title="Design">
            <form onSubmit={submit} className="space-y-8">
                <section>
                    <h2 className="font-semibold">Theme</h2>
                    <p className="mt-1 text-sm text-zinc-500">The overall look: colours, fonts, shapes and section layouts. Manage themes under Themes.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                                        <span className="block truncate text-xs text-zinc-500">
                                            {theme.fonts.heading} / {theme.fonts.body}
                                        </span>
                                    </span>
                                    {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-indigo-600" />}
                                </button>
                            );
                        })}
                    </div>
                    {selectedTheme && <p className="mt-3 text-sm text-zinc-500">{selectedTheme.description}</p>}
                </section>

                <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Brand colours</h2>
                    <p className="mt-1 text-sm text-zinc-500">Leave a colour on the theme default, or set the school’s own. Text colours are adjusted automatically for readability when left on default.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {colorTokens.map(({ key, label }) => {
                            const custom = form.data.colors[key];
                            const value = custom || themeColors[key] || '#000000';

                            return (
                                <div key={key}>
                                    <label htmlFor={`color-${key}`} className="mb-1.5 flex items-center justify-between text-sm font-medium">
                                        {label}
                                        {custom && (
                                            <button type="button" onClick={() => clearColor(key)} className="flex items-center gap-1 text-xs font-normal text-zinc-500 hover:text-zinc-900">
                                                <RotateCcw className="h-3 w-3" /> Theme default
                                            </button>
                                        )}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" aria-label={`${label} picker`} value={value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join('')}` : value} onChange={(event) => setColor(key, event.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1" />
                                        <input id={`color-${key}`} value={custom ?? ''} placeholder={themeColors[key]} onChange={(event) => (event.target.value ? setColor(key, event.target.value) : clearColor(key))} className={`${inputClass} font-mono`} />
                                    </div>
                                    <FieldError message={errors[`colors.${key}`]} />
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Fonts</h2>
                    <p className="mt-1 text-sm text-zinc-500">Any Google Fonts family name. Leave empty to use the theme’s fonts.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {(['heading', 'body'] as const).map((role) => (
                            <div key={role}>
                                <label htmlFor={`font-${role}`} className="mb-1.5 block text-sm font-medium capitalize">
                                    {role} font
                                </label>
                                <input id={`font-${role}`} value={form.data.fonts[role]} placeholder={role === 'heading' ? selectedTheme?.fonts.heading : selectedTheme?.fonts.body} onChange={(event) => form.setData('fonts', { ...form.data.fonts, [role]: event.target.value })} className={inputClass} />
                                <FieldError message={errors[`fonts.${role}`]} />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Section layouts</h2>
                    <p className="mt-1 text-sm text-zinc-500">Each section has alternative layouts. These apply site-wide; individual pages can still override them.</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {components.map((component) => (
                            <div key={component.name}>
                                <label htmlFor={`variant-${component.name}`} className="mb-1.5 block text-sm font-medium">
                                    {component.label}
                                </label>
                                <select
                                    id={`variant-${component.name}`}
                                    value={form.data.variants[component.name] ?? ''}
                                    onChange={(event) => form.setData('variants', { ...form.data.variants, [component.name]: event.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Theme default{themeVariants[component.name] ? ` (${themeVariants[component.name]})` : ''}</option>
                                    {component.variants.map((variant) => (
                                        <option key={variant} value={variant}>
                                            {variant}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={errors[`variants.${component.name}`]} />
                            </div>
                        ))}
                    </div>
                </section>

                <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-zinc-200 bg-zinc-50/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
                    <button type="submit" disabled={form.processing} className={buttonClass.primary}>
                        <Save className="h-4 w-4" /> {form.processing ? 'Saving…' : 'Save design'}
                    </button>
                </div>
            </form>
        </ProjectLayout>
    );
}
