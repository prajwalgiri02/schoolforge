import { router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Palette, RotateCcw, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';
import { useAdminUrl } from '@/admin/urls';

type Page = { slug: string; title: string; navLabel: string; description: string; showInNav: boolean; edited: boolean };

const colorFields = [
    ['primary', 'Main colour', 'Header, buttons and headings'],
    ['secondary', 'Second colour', 'Footer and dark sections'],
    ['accent', 'Accent', 'Highlights and small details'],
] as const;

export default function Website({ pages, colors }: { pages: Page[]; colors: Record<string, string> }) {
    const admin = useAdminUrl();
    const pageForm = useForm({ pages });
    const designForm = useForm({ colors: { primary: colors.primary ?? '', secondary: colors.secondary ?? '', accent: colors.accent ?? '' } });

    const update = (index: number, patch: Partial<Page>) => pageForm.setData('pages', pageForm.data.pages.map((page, position) => (position === index ? { ...page, ...patch } : page)));
    const move = (from: number, to: number) => {
        const next = [...pageForm.data.pages];
        const [page] = next.splice(from, 1);
        next.splice(to, 0, page);
        pageForm.setData('pages', next);
    };

    const savePages = (event: FormEvent) => {
        event.preventDefault();
        pageForm.put(admin('/website/pages'), { preserveScroll: true });
    };

    const saveDesign = (event: FormEvent) => {
        event.preventDefault();
        designForm.put(admin('/website/design'), { preserveScroll: true });
    };

    return (
        <AdminLayout title="Pages & design" description="Page titles, the menu and the website’s colours.">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <form onSubmit={savePages} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-5">
                        <div>
                            <h2 className="font-semibold">Pages and menu</h2>
                            <p className="text-sm text-zinc-500">Rename pages, choose which appear in the menu and in what order.</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => window.confirm('Go back to the generated page titles and menu?') && router.delete(admin('/website/pages'), { preserveScroll: true })} className={buttonClass.secondary}>
                                <RotateCcw className="h-4 w-4" /> Reset
                            </button>
                            <button type="submit" disabled={pageForm.processing} className={buttonClass.primary}>
                                <Save className="h-4 w-4" /> Save
                            </button>
                        </div>
                    </header>
                    <ol className="divide-y divide-zinc-100">
                        {pageForm.data.pages.map((page, index) => (
                            <li key={page.slug} className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
                                <div>
                                    <label htmlFor={`title-${index}`} className="mb-1 block text-xs font-medium text-zinc-500">
                                        Title · <span className="font-mono">{page.slug}</span>
                                    </label>
                                    <input id={`title-${index}`} value={page.title} onChange={(event) => update(index, { title: event.target.value })} className={inputClass} />
                                    {pageForm.errors[`pages.${index}.title` as keyof typeof pageForm.errors] && <p className="mt-1 text-xs text-red-600">Every page needs a title.</p>}
                                </div>
                                <div>
                                    <label htmlFor={`nav-${index}`} className="mb-1 block text-xs font-medium text-zinc-500">
                                        Menu label
                                    </label>
                                    <input id={`nav-${index}`} value={page.navLabel} placeholder={page.title} onChange={(event) => update(index, { navLabel: event.target.value })} className={inputClass} />
                                </div>
                                <div className="flex items-end gap-1">
                                    <label className="flex items-center gap-2 whitespace-nowrap py-2 pr-2 text-sm">
                                        <input type="checkbox" checked={page.showInNav} onChange={(event) => update(index, { showInNav: event.target.checked })} className="h-4 w-4 rounded border-zinc-300" />
                                        In menu
                                    </label>
                                    <button type="button" aria-label={`Move ${page.title} up`} disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button type="button" aria-label={`Move ${page.title} down`} disabled={index === pageForm.data.pages.length - 1} onClick={() => move(index, index + 1)} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="sm:col-span-3">
                                    <label htmlFor={`description-${index}`} className="mb-1 block text-xs font-medium text-zinc-500">
                                        Description (search engines and page header)
                                    </label>
                                    <input id={`description-${index}`} value={page.description} onChange={(event) => update(index, { description: event.target.value })} className={inputClass} />
                                </div>
                            </li>
                        ))}
                    </ol>
                </form>
                <form onSubmit={saveDesign} className="h-fit space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <Palette className="h-4 w-4" /> Brand colours
                    </h2>
                    <p className="text-sm text-zinc-500">Leave a colour empty to use the theme’s. Text colours adjust automatically so they stay readable.</p>
                    {colorFields.map(([key, label, help]) => (
                        <div key={key}>
                            <label htmlFor={`color-${key}`} className="mb-1 block text-sm font-medium">
                                {label} <span className="font-normal text-zinc-400">· {help}</span>
                            </label>
                            <div className="flex gap-2">
                                <input type="color" aria-label={`${label} picker`} value={designForm.data.colors[key] || '#000000'} onChange={(event) => designForm.setData('colors', { ...designForm.data.colors, [key]: event.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-300" />
                                <input id={`color-${key}`} value={designForm.data.colors[key]} placeholder="Theme colour" onChange={(event) => designForm.setData('colors', { ...designForm.data.colors, [key]: event.target.value })} className={`${inputClass} font-mono`} />
                            </div>
                            {designForm.errors[`colors.${key}` as keyof typeof designForm.errors] && <p className="mt-1 text-xs text-red-600">{designForm.errors[`colors.${key}` as keyof typeof designForm.errors]}</p>}
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <button type="submit" disabled={designForm.processing} className={buttonClass.primary}>
                            <Save className="h-4 w-4" /> Save colours
                        </button>
                        <button type="button" onClick={() => router.put(admin('/website/design'), { colors: {} }, { preserveScroll: true })} className={buttonClass.secondary}>
                            Use theme colours
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
