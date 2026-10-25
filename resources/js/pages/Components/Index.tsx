import { Link, useForm } from '@inertiajs/react';
import { ChevronRight, Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError, PageHeading, StudioLayout } from '@/studio/StudioLayout';

type ComponentRow = { name: string; label: string; description: string; category: string; variants: string[]; customPages: number; themeOverrides: string[] };

export default function ComponentsIndex({ components }: { components: ComponentRow[]; canEditCode: boolean }) {
    const form = useForm({ name: '', label: '', variants: 'default' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/components');
    };

    const groups = [
        { title: 'Page sections', items: components.filter((component) => component.category !== 'layout') },
        { title: 'Header & footer', items: components.filter((component) => component.category === 'layout') },
    ];

    return (
        <StudioLayout title="Components">
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <PageHeading
                    title="Components"
                    description="The building blocks of every page, shared by all schools and both frameworks. They live in generator/registry/components. Add a component to a page from a school’s Pages tab."
                />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="space-y-8">
                        {groups.map((group) => (
                            <section key={group.title}>
                                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{group.title}</h2>
                                <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                                    {group.items.map((component) => (
                                        <Link key={component.name} href={`/components/${component.name}/edit`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-50">
                                            <div className="min-w-0 flex-1">
                                                <p className="flex flex-wrap items-center gap-2 font-medium">
                                                    {component.label}
                                                    <code className="text-xs font-normal text-zinc-400">{component.name}</code>
                                                </p>
                                                <p className="truncate text-sm text-zinc-500">{component.description}</p>
                                            </div>
                                            <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                                                {component.variants.map((variant) => (
                                                    <span key={variant} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                                                        {variant}
                                                    </span>
                                                ))}
                                            </div>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                    <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold">New component</h2>
                        <div>
                            <label htmlFor="component-label" className="mb-1.5 block text-sm font-medium">
                                Display name
                            </label>
                            <input
                                id="component-label"
                                value={form.data.label}
                                onChange={(event) => form.setData((data) => ({ ...data, label: event.target.value, name: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }))}
                                placeholder="e.g. Sports Highlights"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="component-name" className="mb-1.5 block text-sm font-medium">
                                Folder name
                            </label>
                            <input id="component-name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={`${inputClass} font-mono`} />
                            <FieldError message={form.errors.name} />
                        </div>
                        <div>
                            <label htmlFor="component-variants" className="mb-1.5 block text-sm font-medium">
                                Layouts
                            </label>
                            <input id="component-variants" value={form.data.variants} onChange={(event) => form.setData('variants', event.target.value)} placeholder="grid, list" className={inputClass} />
                            <FieldError message={form.errors.variants} />
                        </div>
                        <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                            <Plus className="h-4 w-4" /> Create component
                        </button>
                        <p className="text-xs text-zinc-500">Creates a starter React component you can edit here or in your code editor.</p>
                    </form>
                </div>
            </main>
        </StudioLayout>
    );
}
