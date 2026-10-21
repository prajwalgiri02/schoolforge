import { router, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronDown, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { ProjectLayout } from '@/studio/ProjectLayout';
import { FieldError } from '@/studio/StudioLayout';
import type { ComponentSummary, ProjectSummary } from '@/studio/types';

type Section = { type: string; variant?: string; title?: string; subtitle?: string; eyebrow?: string; limit?: number; paragraphs?: string[]; [key: string]: string | number | boolean | string[] | null | undefined };

type Page = { slug: string; title: string; navLabel?: string; description?: string; showInNav?: boolean; sections: Section[] };

type PageTranslation = { title?: string; navLabel?: string; description?: string };

type Translations = Record<string, Record<string, PageTranslation>>;

type Props = {
    project: ProjectSummary;
    languages: string[];
    pageTranslations: Translations;
    isCustom: boolean;
    pages: Page[];
    components: ComponentSummary[];
    themeVariants: Record<string, string>;
};

function move<T>(items: T[], from: number, to: number): T[] {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);

    return next;
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * The page last selected in each project's editor, so the selection survives the
 * remount that happens when a school switches between default and custom pages.
 */
const lastSelectedSlug: Record<string, string> = {};

const languageNames: Record<string, string> = { en: 'English', ne: 'नेपाली' };

export default function PagesEditor(props: Props) {
    return <Editor key={String(props.isCustom)} {...props} />;
}

function Editor({ project, isCustom, pages: initialPages, components, themeVariants, languages, pageTranslations }: Props) {
    const errors = usePage().props.errors as Record<string, string | undefined>;
    const [pages, setPages] = useState<Page[]>(initialPages);
    const [selected, setSelectedIndex] = useState(() => Math.max(0, initialPages.findIndex((item) => item.slug === lastSelectedSlug[project.slug])));
    const [openSection, setOpenSection] = useState<number | null>(null);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [newSectionType, setNewSectionType] = useState(components[0]?.name ?? '');
    const [processing, setProcessing] = useState(false);
    const [translations, setTranslations] = useState<Translations>(() => Object.fromEntries(languages.slice(1).map((code) => [code, { ...(pageTranslations[code] ?? {}) }])));
    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify([initialPages, translations]));
    const page = pages[selected] ?? pages[0];
    const selectPage = (index: number, slug = pages[index]?.slug ?? '/') => {
        lastSelectedSlug[project.slug] = slug;
        setSelectedIndex(index);
    };
    const labels = Object.fromEntries(components.map((component) => [component.name, component.label]));
    const variantsOf = Object.fromEntries(components.map((component) => [component.name, component.variants]));
    const isDirty = JSON.stringify([pages, translations]) !== savedSnapshot;

    const updatePage = (patch: Partial<Page>) => {
        if (patch.slug !== undefined) {
            lastSelectedSlug[project.slug] = patch.slug;
            const from = page.slug;
            const to = patch.slug;
            setTranslations(
                Object.fromEntries(
                    Object.entries(translations).map(([code, bySlug]) => {
                        const { [from]: moved, ...rest } = bySlug;

                        return [code, moved ? { ...rest, [to]: moved } : rest];
                    }),
                ),
            );
        }

        setPages(pages.map((item, index) => (index === selected ? { ...item, ...patch } : item)));
    };
    const updateTranslation = (code: string, patch: PageTranslation) =>
        setTranslations({ ...translations, [code]: { ...translations[code], [page.slug]: { ...translations[code]?.[page.slug], ...patch } } });
    const updateSection = (sectionIndex: number, patch: Partial<Section>) =>
        updatePage({ sections: page.sections.map((section, index) => (index === sectionIndex ? { ...section, ...patch } : section)) });

    const addPage = () => {
        const title = newPageTitle.trim();

        if (!title) {
            return;
        }

        const slug = `/${slugify(title) || 'page'}`;
        setPages([...pages, { slug, title, showInNav: true, sections: [{ type: 'page-header' }] }]);
        selectPage(pages.length, slug);
        setNewPageTitle('');
    };

    const removePage = () => {
        if (page.slug === '/' || !window.confirm(`Delete the page “${page.title}”?`)) {
            return;
        }

        setPages(pages.filter((_, index) => index !== selected));
        selectPage(0);
    };

    const save = (event: FormEvent) => {
        event.preventDefault();
        router.put(
            `/projects/${project.slug}/pages`,
            { pages, translations },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setSavedSnapshot(JSON.stringify([pages, translations])),
            },
        );
    };

    const reset = () => {
        if (window.confirm('Discard the custom pages and go back to the default site map?')) {
            router.delete(`/projects/${project.slug}/pages`, { preserveScroll: true });
        }
    };

    const pageError = (field: string) => errors[`pages.${selected}.${field}`];
    const errorCount = Object.keys(errors).length;

    return (
        <ProjectLayout project={project} title="Pages" previewPath={page.slug === '/' ? '' : page.slug}>
            <form onSubmit={save} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-xl text-sm text-zinc-500">
                        {isCustom
                            ? 'This school uses a custom site map. Add pages, and add, remove or reorder the sections on each page.'
                            : 'Using the default site map: pages without content are hidden automatically. Saving here switches to a custom site map.'}
                    </p>
                    <div className="flex gap-2">
                        {isCustom && (
                            <button type="button" onClick={reset} className={buttonClass.secondary}>
                                <RotateCcw className="h-4 w-4" /> Use default pages
                            </button>
                        )}
                        <button type="submit" disabled={processing} className={buttonClass.primary}>
                            <Save className="h-4 w-4" /> {processing ? 'Saving…' : isDirty ? 'Save pages' : 'Saved'}
                        </button>
                    </div>
                </div>

                {errorCount > 0 && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errors.pages ?? `Please fix ${errorCount === 1 ? 'the highlighted problem' : `${errorCount} problems`} before saving.`}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <div className="space-y-3">
                        <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            {pages.map((item, index) => {
                                const hasError = Object.keys(errors).some((key) => key.startsWith(`pages.${index}.`));

                                return (
                                    <li key={`${item.slug}-${index}`} className={`group flex items-center border-b border-zinc-100 last:border-0 ${index === selected ? 'bg-indigo-50' : ''}`}>
                                        <button type="button" onClick={() => selectPage(index)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                                            <span className={`block truncate text-sm font-medium ${hasError ? 'text-red-600' : index === selected ? 'text-indigo-700' : ''}`}>{item.title}</span>
                                            <span className="block truncate font-mono text-xs text-zinc-400">{item.slug}</span>
                                        </button>
                                        <span className="flex opacity-0 transition group-hover:opacity-100">
                                            <button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0} onClick={() => (setPages(move(pages, index, index - 1)), selectPage(index - 1, item.slug))} className="p-1 text-zinc-400 hover:text-zinc-900 disabled:opacity-30">
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button type="button" aria-label={`Move ${item.title} down`} disabled={index === pages.length - 1} onClick={() => (setPages(move(pages, index, index + 1)), selectPage(index + 1, item.slug))} className="p-1 pr-2 text-zinc-400 hover:text-zinc-900 disabled:opacity-30">
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </button>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="flex gap-2">
                            <input aria-label="New page title" value={newPageTitle} onChange={(event) => setNewPageTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addPage())} placeholder="New page title" className={inputClass} />
                            <button type="button" onClick={addPage} aria-label="Add page" className={buttonClass.secondary}>
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="min-w-0 space-y-6">
                        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="page-title" className="mb-1.5 block text-sm font-medium">
                                        Page title
                                    </label>
                                    <input id="page-title" value={page.title} onChange={(event) => updatePage({ title: event.target.value })} className={inputClass} />
                                    <FieldError message={pageError('title')} />
                                </div>
                                <div>
                                    <label htmlFor="page-slug" className="mb-1.5 block text-sm font-medium">
                                        Address
                                    </label>
                                    <input id="page-slug" value={page.slug} disabled={page.slug === '/' && initialPages.some((item) => item.slug === '/')} onChange={(event) => updatePage({ slug: event.target.value })} className={`${inputClass} font-mono disabled:bg-zinc-100`} />
                                    <FieldError message={pageError('slug')} />
                                </div>
                                <div>
                                    <label htmlFor="page-nav" className="mb-1.5 block text-sm font-medium">
                                        Menu label
                                    </label>
                                    <input id="page-nav" value={page.navLabel ?? ''} placeholder={page.title} onChange={(event) => updatePage({ navLabel: event.target.value })} className={inputClass} />
                                </div>
                                <label className="flex items-center gap-3 self-end pb-2 text-sm font-medium">
                                    <input type="checkbox" checked={page.showInNav !== false} onChange={(event) => updatePage({ showInNav: event.target.checked })} className="h-4 w-4 rounded border-zinc-300" />
                                    Show in the main menu
                                </label>
                                <div className="sm:col-span-2">
                                    <label htmlFor="page-description" className="mb-1.5 block text-sm font-medium">
                                        Description <span className="font-normal text-zinc-400">(search engines and page header)</span>
                                    </label>
                                    <input id="page-description" value={page.description ?? ''} onChange={(event) => updatePage({ description: event.target.value })} className={inputClass} />
                                </div>
                            </div>
                            {languages.slice(1).map((code) => (
                                <fieldset key={code} className="mt-5 grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">
                                    <legend className="sr-only">{languageNames[code] ?? code}</legend>
                                    <div>
                                        <label htmlFor={`page-title-${code}`} className="mb-1.5 block text-sm font-medium">
                                            Page title <span className="font-normal text-zinc-400">({languageNames[code] ?? code})</span>
                                        </label>
                                        <input id={`page-title-${code}`} lang={code} value={translations[code]?.[page.slug]?.title ?? ''} placeholder={page.title} onChange={(event) => updateTranslation(code, { title: event.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label htmlFor={`page-nav-${code}`} className="mb-1.5 block text-sm font-medium">
                                            Menu label <span className="font-normal text-zinc-400">({languageNames[code] ?? code})</span>
                                        </label>
                                        <input id={`page-nav-${code}`} lang={code} value={translations[code]?.[page.slug]?.navLabel ?? ''} placeholder={translations[code]?.[page.slug]?.title || page.navLabel || page.title} onChange={(event) => updateTranslation(code, { navLabel: event.target.value })} className={inputClass} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor={`page-description-${code}`} className="mb-1.5 block text-sm font-medium">
                                            Description <span className="font-normal text-zinc-400">({languageNames[code] ?? code})</span>
                                        </label>
                                        <input id={`page-description-${code}`} lang={code} value={translations[code]?.[page.slug]?.description ?? ''} placeholder={page.description} onChange={(event) => updateTranslation(code, { description: event.target.value })} className={inputClass} />
                                    </div>
                                </fieldset>
                            ))}
                            {page.slug !== '/' && (
                                <button type="button" onClick={removePage} className={`${buttonClass.danger} mt-4`}>
                                    <Trash2 className="h-4 w-4" /> Delete page
                                </button>
                            )}
                        </section>

                        <section>
                            <h2 className="mb-3 text-sm font-semibold">Sections on this page</h2>
                            <ol className="space-y-2">
                                {page.sections.map((section, index) => {
                                    const open = openSection === index;
                                    const sectionError = Object.entries(errors).find(([key]) => key.startsWith(`pages.${selected}.sections.${index}.`))?.[1];
                                    const variants = variantsOf[section.type] ?? [];

                                    return (
                                        <li key={`${section.type}-${index}`} className={`rounded-xl border bg-white shadow-sm ${sectionError ? 'border-red-300' : 'border-zinc-200'}`}>
                                            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-500">{index + 1}</span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium">{labels[section.type] ?? section.type}</span>
                                                    {section.title && <span className="block truncate text-xs text-zinc-500">“{section.title}”</span>}
                                                </span>
                                                {variants.length > 1 && (
                                                    <select aria-label="Layout" value={section.variant ?? ''} onChange={(event) => updateSection(index, { variant: event.target.value || undefined })} className="rounded-lg border border-zinc-300 py-1.5 pl-2 pr-8 text-xs">
                                                        <option value="">Default ({themeVariants[section.type] ?? variants[0]})</option>
                                                        {variants.map((variant) => (
                                                            <option key={variant} value={variant}>
                                                                {variant}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                <span className="flex items-center">
                                                    <button type="button" aria-label="Options" onClick={() => setOpenSection(open ? null : index)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100">
                                                        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => updatePage({ sections: move(page.sections, index, index - 1) })} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                                                        <ArrowUp className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" aria-label="Move down" disabled={index === page.sections.length - 1} onClick={() => updatePage({ sections: move(page.sections, index, index + 1) })} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                                                        <ArrowDown className="h-4 w-4" />
                                                    </button>
                                                    <button type="button" aria-label="Remove section" onClick={() => updatePage({ sections: page.sections.filter((_, position) => position !== index) })} className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </span>
                                            </div>
                                            {sectionError && <p className="px-4 pb-3 text-sm text-red-600">{sectionError}</p>}
                                            {open && (
                                                <div className="grid gap-4 border-t border-zinc-100 px-4 py-4 sm:grid-cols-2">
                                                    {(['eyebrow', 'title', 'subtitle'] as const).map((field) => (
                                                        <div key={field} className={field === 'subtitle' ? 'sm:col-span-2' : ''}>
                                                            <label className="mb-1 block text-xs font-medium capitalize text-zinc-600">{field === 'eyebrow' ? 'Small heading' : field}</label>
                                                            <input value={(section[field] as string | undefined) ?? ''} placeholder="Default" onChange={(event) => updateSection(index, { [field]: event.target.value || undefined })} className={inputClass} />
                                                        </div>
                                                    ))}
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-zinc-600">Show at most</label>
                                                        <input type="number" min={1} max={100} value={section.limit ?? ''} placeholder="All items" onChange={(event) => updateSection(index, { limit: event.target.value ? Number(event.target.value) : undefined })} className={inputClass} />
                                                    </div>
                                                    {section.type === 'rich-text' && (
                                                        <div className="sm:col-span-2">
                                                            <label className="mb-1 block text-xs font-medium text-zinc-600">Text (separate paragraphs with a blank line)</label>
                                                            <textarea
                                                                rows={6}
                                                                defaultValue={(section.paragraphs ?? []).join('\n\n')}
                                                                onChange={(event) => updateSection(index, { paragraphs: event.target.value.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean) })}
                                                                className={inputClass}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                            <div className="mt-3 flex gap-2">
                                <select aria-label="Section to add" value={newSectionType} onChange={(event) => setNewSectionType(event.target.value)} className={`${inputClass} max-w-xs`}>
                                    {components.map((component) => (
                                        <option key={component.name} value={component.name}>
                                            {component.label}
                                        </option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => (updatePage({ sections: [...page.sections, { type: newSectionType }] }), setOpenSection(page.sections.length))} className={buttonClass.secondary}>
                                    <Plus className="h-4 w-4" /> Add section
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-zinc-500">{components.find((component) => component.name === newSectionType)?.description}</p>
                        </section>
                    </div>
                </div>
            </form>
        </ProjectLayout>
    );
}
