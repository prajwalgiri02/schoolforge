import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError, StudioLayout } from '@/studio/StudioLayout';
import type { ComponentSummary } from '@/studio/types';

type Props = {
    theme: { name: string; label: string; description: string; extends: string | null; overrides: string[] };
    own: {
        colors: Record<string, string>;
        fonts: { heading: string | null; body: string | null };
        radius: Record<string, string>;
        headingWeight: number | null;
        variants: Record<string, string>;
        extraCss: string;
    };
    resolved: {
        colors: Record<string, string>;
        fonts: Record<string, { family: string }>;
        radius: Record<string, string>;
        heading: { weight: number };
    };
    resolvedVariants: Record<string, string>;
    components: ComponentSummary[];
};

const colorTokens = ['primary', 'primaryForeground', 'secondary', 'secondaryForeground', 'accent', 'accentForeground', 'background', 'foreground', 'muted', 'mutedForeground', 'surface', 'border'];

function labelFor(token: string): string {
    return token.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

export default function ThemeEdit({ theme, own, resolved, resolvedVariants, components }: Props) {
    const isBase = theme.extends === null;
    const form = useForm({
        label: theme.label,
        description: theme.description,
        colors: { ...own.colors } as Record<string, string>,
        fonts: { heading: own.fonts.heading ?? '', body: own.fonts.body ?? '' },
        radius: { card: own.radius.card ?? '', button: own.radius.button ?? '' },
        heading_weight: own.headingWeight ? String(own.headingWeight) : '',
        variants: { ...own.variants } as Record<string, string>,
        extra_css: own.extraCss,
    });
    const errors = form.errors as Record<string, string | undefined>;
    const preview = { ...resolved.colors, ...Object.fromEntries(Object.entries(form.data.colors).filter(([, value]) => /^#[0-9a-f]{6}$/i.test(value))) };
    const inherited = (value: string | undefined) => (isBase ? undefined : `${value ?? ''} (from ${theme.extends})`);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(`/themes/${theme.name}`, { preserveScroll: true });
    };

    return (
        <StudioLayout title={`${theme.label} theme`}>
            <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <Link href="/themes" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
                    <ArrowLeft className="h-4 w-4" /> All themes
                </Link>
                <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="space-y-6">
                        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h1 className="text-xl font-semibold">{theme.label}</h1>
                                <code className="text-xs text-zinc-500">generator/registry/themes/{theme.name}</code>
                            </div>
                            {!isBase && <p className="text-sm text-zinc-500">Extends {theme.extends}. Empty fields inherit its values.</p>}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="label" className="mb-1.5 block text-sm font-medium">
                                        Display name
                                    </label>
                                    <input id="label" value={form.data.label} onChange={(event) => form.setData('label', event.target.value)} className={inputClass} />
                                    <FieldError message={errors.label} />
                                </div>
                                <div>
                                    <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                                        Description
                                    </label>
                                    <input id="description" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="font-semibold">Colours</h2>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                {colorTokens.map((token) => (
                                    <div key={token}>
                                        <label htmlFor={`color-${token}`} className="mb-1.5 block text-sm font-medium">
                                            {labelFor(token)}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" aria-label={`${labelFor(token)} picker`} value={preview[token] ?? '#000000'} onChange={(event) => form.setData('colors', { ...form.data.colors, [token]: event.target.value })} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1" />
                                            <input id={`color-${token}`} value={form.data.colors[token] ?? ''} placeholder={inherited(resolved.colors[token])} onChange={(event) => form.setData('colors', { ...form.data.colors, [token]: event.target.value })} className={`${inputClass} font-mono`} />
                                        </div>
                                        <FieldError message={errors[`colors.${token}`]} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="font-semibold">Typography & shape</h2>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                {(['heading', 'body'] as const).map((role) => (
                                    <div key={role}>
                                        <label htmlFor={`font-${role}`} className="mb-1.5 block text-sm font-medium capitalize">
                                            {role} font (Google Fonts)
                                        </label>
                                        <input id={`font-${role}`} value={form.data.fonts[role]} placeholder={inherited(resolved.fonts[role]?.family)} onChange={(event) => form.setData('fonts', { ...form.data.fonts, [role]: event.target.value })} className={inputClass} />
                                        <FieldError message={errors[`fonts.${role}`]} />
                                    </div>
                                ))}
                                {(['card', 'button'] as const).map((key) => (
                                    <div key={key}>
                                        <label htmlFor={`radius-${key}`} className="mb-1.5 block text-sm font-medium capitalize">
                                            {key} corner radius
                                        </label>
                                        <input id={`radius-${key}`} value={form.data.radius[key]} placeholder={resolved.radius[key]} onChange={(event) => form.setData('radius', { ...form.data.radius, [key]: event.target.value })} className={`${inputClass} font-mono`} />
                                        <FieldError message={errors[`radius.${key}`]} />
                                    </div>
                                ))}
                                <div>
                                    <label htmlFor="heading-weight" className="mb-1.5 block text-sm font-medium">
                                        Heading weight
                                    </label>
                                    <select id="heading-weight" value={form.data.heading_weight} onChange={(event) => form.setData('heading_weight', event.target.value)} className={inputClass}>
                                        <option value="">Default ({resolved.heading.weight})</option>
                                        {[400, 500, 600, 700, 800, 900].map((weight) => (
                                            <option key={weight} value={weight}>
                                                {weight}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError message={errors.heading_weight} />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="font-semibold">Section layouts</h2>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                {components.map((component) => (
                                    <div key={component.name}>
                                        <label htmlFor={`variant-${component.name}`} className="mb-1.5 block text-sm font-medium">
                                            {component.label}
                                        </label>
                                        <select id={`variant-${component.name}`} value={form.data.variants[component.name] ?? ''} onChange={(event) => form.setData('variants', { ...form.data.variants, [component.name]: event.target.value })} className={inputClass}>
                                            <option value="">{isBase ? 'Component default' : `Inherited (${resolvedVariants[component.name] ?? component.variants[0]})`}</option>
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

                        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <h2 className="font-semibold">Custom CSS</h2>
                            <p className="mt-1 text-sm text-zinc-500">
                                Scope rules with <code>.theme-{theme.name}</code> so they only affect this theme.
                            </p>
                            <textarea aria-label="Custom CSS" rows={8} value={form.data.extra_css} onChange={(event) => form.setData('extra_css', event.target.value)} className={`${inputClass} mt-3 font-mono text-xs`} spellCheck={false} />
                            <FieldError message={errors.extra_css} />
                            {theme.overrides.length > 0 && <p className="mt-3 text-sm text-zinc-500">This theme replaces these components with its own versions: {theme.overrides.join(', ')}.</p>}
                        </section>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
                        <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm" style={{ background: preview.background }}>
                            <div className="p-5" style={{ background: preview.primary, color: preview.primaryForeground }}>
                                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: preview.accent }}>
                                    Welcome
                                </p>
                                <p className="mt-1 text-xl font-bold" style={{ fontFamily: form.data.fonts.heading || resolved.fonts.heading?.family }}>
                                    {form.data.label || 'Theme'}
                                </p>
                                <span className="mt-3 inline-block px-3 py-1.5 text-xs font-semibold" style={{ background: preview.accent, color: preview.accentForeground, borderRadius: form.data.radius.button || resolved.radius.button }}>
                                    Apply now
                                </span>
                            </div>
                            <div className="p-5" style={{ color: preview.foreground }}>
                                <div className="border p-4 text-sm" style={{ background: preview.surface, borderColor: preview.border, borderRadius: form.data.radius.card || resolved.radius.card }}>
                                    <p className="font-semibold">Card title</p>
                                    <p className="mt-1" style={{ color: preview.mutedForeground }}>
                                        Supporting text in the muted colour.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                            <Save className="h-4 w-4" /> {form.processing ? 'Saving…' : 'Save theme'}
                        </button>
                        <p className="text-xs text-zinc-500">Saved to theme.json in the generator registry. Schools using this theme pick it up in their preview immediately and in generated code on the next generate.</p>
                        <a href={`/themes/${theme.name}/export`} className={`${buttonClass.secondary} w-full`}>
                            <Download className="h-4 w-4" /> Export theme file
                        </a>
                    </aside>
                </form>
            </main>
        </StudioLayout>
    );
}
