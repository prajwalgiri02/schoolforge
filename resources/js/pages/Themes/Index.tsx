import { Link, useForm } from '@inertiajs/react';
import { ChevronRight, Plus, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError, PageHeading, StudioLayout } from '@/studio/StudioLayout';
import type { ThemeSummary } from '@/studio/types';

export default function ThemesIndex({ themes }: { themes: (ThemeSummary & { projects: number })[] }) {
    const form = useForm({ name: '', from: themes[0]?.name ?? 'classic', label: '' });
    const importForm = useForm<{ file: File | null; name: string }>({ file: null, name: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/themes');
    };

    return (
        <StudioLayout title="Themes">
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <PageHeading title="Themes" description="Themes live in generator/registry/themes and are shared by every school. A new theme starts as a copy that extends an existing one, so you only change what is different." />
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="grid gap-5 sm:grid-cols-2">
                        {themes.map((theme) => (
                            <Link key={theme.name} href={`/themes/${theme.name}/edit`} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="p-5" style={{ background: theme.colors.background }}>
                                    <div className="rounded-lg p-4" style={{ background: theme.colors.primary }}>
                                        <p className="text-lg font-bold" style={{ color: '#fff', fontFamily: theme.fonts.heading }}>
                                            Aa
                                        </p>
                                        <span className="mt-3 inline-block rounded px-3 py-1 text-xs font-semibold" style={{ background: theme.colors.accent }}>
                                            Apply now
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 p-5">
                                    <div className="min-w-0">
                                        <p className="font-semibold group-hover:text-indigo-700">{theme.label}</p>
                                        <p className="text-xs text-zinc-500">
                                            {theme.extends ? `Extends ${theme.extends} · ` : ''}
                                            {theme.projects} school{theme.projects === 1 ? '' : 's'}
                                        </p>
                                        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{theme.description}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                    <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold">New theme</h2>
                        <div>
                            <label htmlFor="theme-label" className="mb-1.5 block text-sm font-medium">
                                Display name
                            </label>
                            <input
                                id="theme-label"
                                value={form.data.label}
                                onChange={(event) => form.setData((data) => ({ ...data, label: event.target.value, name: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }))}
                                placeholder="e.g. Royal Blue"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="theme-name" className="mb-1.5 block text-sm font-medium">
                                Folder name
                            </label>
                            <input id="theme-name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={`${inputClass} font-mono`} />
                            <FieldError message={form.errors.name} />
                        </div>
                        <div>
                            <label htmlFor="theme-from" className="mb-1.5 block text-sm font-medium">
                                Start from
                            </label>
                            <select id="theme-from" value={form.data.from} onChange={(event) => form.setData('from', event.target.value)} className={inputClass}>
                                {themes.map((theme) => (
                                    <option key={theme.name} value={theme.name}>
                                        {theme.label}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={form.errors.from} />
                        </div>
                        <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                            <Plus className="h-4 w-4" /> Create theme
                        </button>
                    </form>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            importForm.post('/themes/import', { forceFormData: true });
                        }}
                        className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-start-2"
                    >
                        <div>
                            <h2 className="font-semibold">Import a theme</h2>
                            <p className="mt-1 text-sm text-zinc-500">A .theme.json file exported from another Studio.</p>
                        </div>
                        <input type="file" accept=".json,application/json" aria-label="Theme file" onChange={(event) => importForm.setData('file', event.target.files?.[0] ?? null)} className={inputClass} />
                        <div>
                            <label htmlFor="import-name" className="mb-1.5 block text-sm font-medium">
                                Folder name <span className="font-normal text-zinc-400">(optional)</span>
                            </label>
                            <input id="import-name" value={importForm.data.name} onChange={(event) => importForm.setData('name', event.target.value)} placeholder="Keep the theme's own name" className={`${inputClass} font-mono`} />
                        </div>
                        <FieldError message={importForm.errors.file ?? importForm.errors.name} />
                        <button type="submit" disabled={importForm.processing || !importForm.data.file} className={`${buttonClass.secondary} w-full`}>
                            <Upload className="h-4 w-4" /> Import theme
                        </button>
                    </form>
                </div>
            </main>
        </StudioLayout>
    );
}
