import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { buttonClass } from '@admin/AdminLayout';
import { FieldGroup, ItemList, MediaLibraryUrlContext, UploadUrlContext } from '@admin/fields';
import type { Item, SectionDefinition } from '@admin/types';
import { ProjectLayout } from '@/studio/ProjectLayout';
import type { ProjectSummary } from '@/studio/types';

type Props = {
    project: ProjectSummary;
    sectionKey: string;
    section: SectionDefinition;
    value: Item | Item[];
    locale: string;
    languages: string[];
    icons: string[];
    sections: { key: string; label: string }[];
};

/** Which website page best shows each content section in the live preview. */
const previewPaths: Record<string, string> = {
    about: '/about',
    principal: '/about',
    achievements: '/about',
    contact: '/contact',
    campuses: '/contact',
    jobs: '/careers',
    fees: '/pay-fees',
    downloads: '/downloads',
    alumni: '/alumni',
    programs: '/academics',
    admissions: '/admissions',
    faqs: '/admissions',
    faculty: '/faculty',
    facilities: '/facilities',
    gallery: '/gallery',
    albums: '/gallery',
    videos: '/gallery',
    news: '/news',
    events: '/news',
    notices: '/news',
};

/**
 * Keyed by section so switching sections starts a fresh editor with that section's data.
 */
export default function EditContent(props: Props) {
    return <Editor key={`${props.sectionKey}:${props.locale}`} {...props} />;
}

const languageNames: Record<string, string> = { en: 'English', ne: 'नेपाली' };

function Editor({ project, sectionKey, section, value: initialValue, locale, languages, icons, sections }: Props) {
    const isTranslation = locale !== languages[0];
    const query = isTranslation ? `?locale=${locale}` : '';
    const errors = usePage().props.errors as Record<string, string | undefined>;
    const [value, setValue] = useState<Item | Item[]>(initialValue);
    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialValue));
    const [processing, setProcessing] = useState(false);
    const isDirty = JSON.stringify(value) !== savedSnapshot;

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.put(
            `/projects/${project.slug}/content/${sectionKey}${query}`,
            { value },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setSavedSnapshot(JSON.stringify(value)),
            },
        );
    };

    const errorCount = Object.keys(errors).length;
    const saveButton = (
        <button type="submit" form="content-form" disabled={processing} className={buttonClass.primary}>
            <Save className="h-4 w-4" /> {processing ? 'Saving…' : isDirty ? 'Save changes' : 'Saved'}
        </button>
    );

    return (
        <ProjectLayout project={project} title={section.label} previewPath={`${isTranslation ? `/${locale}` : ''}${previewPaths[sectionKey] ?? ''}`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href={`/projects/${project.slug}/content`} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" aria-label="All content">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <select
                            aria-label="Content section"
                            value={sectionKey}
                            onChange={(event) => router.visit(`/projects/${project.slug}/content/${event.target.value}${query}`)}
                            className="rounded-lg border-0 bg-transparent py-0 pl-0 pr-8 text-lg font-semibold focus:ring-0"
                        >
                            {sections.map((item) => (
                                <option key={item.key} value={item.key}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-sm text-zinc-500">{section.description}</p>
                    </div>
                </div>
                {saveButton}
            </div>
            {languages.length > 1 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    {languages.map((code, index) => (
                        <Link
                            key={code}
                            href={`/projects/${project.slug}/content/${sectionKey}${index === 0 ? '' : `?locale=${code}`}`}
                            className={`rounded-full px-3 py-1 text-sm font-medium ${code === locale ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                            {languageNames[code] ?? code.toUpperCase()}
                        </Link>
                    ))}
                    {isTranslation && <span className="text-xs text-zinc-500">Fields you leave unchanged keep showing the {languageNames[languages[0]] ?? languages[0]} text.</span>}
                </div>
            )}
            <UploadUrlContext.Provider value="/uploads">
                <MediaLibraryUrlContext.Provider value="/media/library">
                    <form id="content-form" onSubmit={submit} className="space-y-6">
                        {errorCount > 0 && (
                            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Please fix {errorCount === 1 ? 'the highlighted field' : `${errorCount} highlighted fields`} before saving.
                            </div>
                        )}
                        {section.kind === 'list' ? (
                            <ItemList fields={section.fields} value={Array.isArray(value) ? value : []} onChange={setValue} path="value" errors={errors} icons={icons} itemLabel={section.itemLabel} />
                        ) : (
                            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                                <FieldGroup fields={section.fields} value={Array.isArray(value) ? {} : value} onChange={setValue} path="value" errors={errors} icons={icons} />
                            </div>
                        )}
                        <div className="flex justify-end border-t border-zinc-200 pt-6">{saveButton}</div>
                    </form>
    </MediaLibraryUrlContext.Provider>
            </UploadUrlContext.Provider>
        </ProjectLayout>
    );
}
