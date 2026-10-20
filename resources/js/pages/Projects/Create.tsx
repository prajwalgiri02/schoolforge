import { useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError, PageHeading, StudioLayout } from '@/studio/StudioLayout';
import type { Target, ThemeSummary } from '@/studio/types';

export default function CreateProject({ themes, targets }: { themes: ThemeSummary[]; targets: Target[] }) {
    const form = useForm({
        name: '',
        short_name: '',
        tagline: '',
        target: targets[0]?.name ?? 'nextjs',
        theme: themes[0]?.name ?? 'classic',
        start_with: 'sample',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/projects');
    };

    return (
        <StudioLayout title="New school">
            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <PageHeading title="New school website" description="You can change everything later: content, theme, colours, pages and framework." />
                <form onSubmit={submit} className="space-y-8">
                    <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold">School</h2>
                        <div>
                            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                                School name <span className="text-red-500">*</span>
                            </label>
                            <input id="name" autoFocus value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={inputClass} placeholder="e.g. Riverside Heights School" />
                            <FieldError message={form.errors.name} />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="short_name" className="mb-1.5 block text-sm font-medium">
                                    Short name
                                </label>
                                <input id="short_name" value={form.data.short_name} onChange={(event) => form.setData('short_name', event.target.value)} className={inputClass} placeholder="e.g. Riverside" />
                                <FieldError message={form.errors.short_name} />
                            </div>
                            <div>
                                <label htmlFor="tagline" className="mb-1.5 block text-sm font-medium">
                                    Tagline
                                </label>
                                <input id="tagline" value={form.data.tagline} onChange={(event) => form.setData('tagline', event.target.value)} className={inputClass} placeholder="e.g. Inspiring curious minds" />
                                <FieldError message={form.errors.tagline} />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold">Theme</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            {themes.map((theme) => {
                                const selected = form.data.theme === theme.name;

                                return (
                                    <button
                                        key={theme.name}
                                        type="button"
                                        onClick={() => form.setData('theme', theme.name)}
                                        aria-pressed={selected}
                                        className={`relative overflow-hidden rounded-xl border-2 text-left transition ${selected ? 'border-indigo-600 ring-4 ring-indigo-100' : 'border-zinc-200 hover:border-zinc-300'}`}
                                    >
                                        <div className="flex h-16" aria-hidden="true">
                                            {['primary', 'secondary', 'accent', 'background'].map((key) => (
                                                <span key={key} className="flex-1" style={{ background: theme.colors[key] }} />
                                            ))}
                                        </div>
                                        <div className="p-4">
                                            <p className="font-medium">{theme.label}</p>
                                            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{theme.description}</p>
                                            <p className="mt-2 text-xs text-zinc-400">
                                                {theme.fonts.heading} / {theme.fonts.body}
                                            </p>
                                        </div>
                                        {selected && (
                                            <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                                                <Check className="h-4 w-4" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <FieldError message={form.errors.theme} />
                    </section>

                    <section className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:grid-cols-2">
                        <fieldset>
                            <legend className="font-semibold">Framework</legend>
                            <div className="mt-3 space-y-2">
                                {targets.map((target) => (
                                    <label key={target.name} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                                        <input type="radio" name="target" value={target.name} checked={form.data.target === target.name} onChange={() => form.setData('target', target.name)} className="mt-0.5" />
                                        <span>{target.label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend className="font-semibold">Starting content</legend>
                            <div className="mt-3 space-y-2">
                                {[
                                    { value: 'sample', label: 'Sample content', help: 'Programs, faculty, news and more to edit or delete.' },
                                    { value: 'blank', label: 'Blank', help: 'Only the school name. Fill everything in yourself.' },
                                ].map((option) => (
                                    <label key={option.value} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                                        <input type="radio" name="start_with" value={option.value} checked={form.data.start_with === option.value} onChange={() => form.setData('start_with', option.value)} className="mt-0.5" />
                                        <span>
                                            <span className="font-medium">{option.label}</span>
                                            <span className="block text-zinc-500">{option.help}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </section>

                    <div className="flex justify-end">
                        <button type="submit" disabled={form.processing} className={buttonClass.primary}>
                            {form.processing ? 'Creating…' : 'Create school'}
                        </button>
                    </div>
                </form>
            </main>
        </StudioLayout>
    );
}
