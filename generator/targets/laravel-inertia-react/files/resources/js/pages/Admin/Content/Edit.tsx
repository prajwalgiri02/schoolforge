import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { AdminLayout, buttonClass } from '@/admin/AdminLayout';
import { FieldGroup, ItemList } from '@/admin/fields';
import type { Item, SectionDefinition } from '@/admin/types';
import { useAdminUrl } from '@/admin/urls';

type Props = {
    sectionKey: string;
    section: SectionDefinition;
    value: Item | Item[];
    isEdited: boolean;
    locale: string;
    locales: string[];
    defaultLocale: string;
    icons: string[];
    sections: { key: string; label: string }[];
};

/**
 * Keyed by section and edited state, so switching sections or resetting to the
 * original content starts a fresh editor from the server's value.
 */
export default function EditContent(props: Props) {
    return <Editor key={`${props.sectionKey}:${props.locale}:${props.isEdited}`} {...props} />;
}

const languageNames: Record<string, string> = { en: 'English', ne: 'नेपाली' };

function Editor({ sectionKey, section, value: initialValue, isEdited, locale, locales, defaultLocale, icons, sections }: Props) {
    const admin = useAdminUrl();
    const query = locale === defaultLocale ? '' : `?locale=${locale}`;
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
            admin(`/content/${sectionKey}${query}`),
            { value },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => setSavedSnapshot(JSON.stringify(value)),
            },
        );
    };

    const reset = () => {
        if (window.confirm(`Discard all admin edits to “${section.label}” and restore the original content?`)) {
            router.delete(admin(`/content/${sectionKey}${query}`), { preserveScroll: true });
        }
    };

    const errorCount = Object.keys(errors).length;

    return (
        <AdminLayout
            title={section.label}
            actions={
                <>
                    {isEdited && (
                        <button type="button" onClick={reset} className={buttonClass.secondary}>
                            <RotateCcw className="h-4 w-4" /> Reset to original
                        </button>
                    )}
                    <button type="submit" form="content-form" disabled={processing} className={buttonClass.primary}>
                        <Save className="h-4 w-4" /> {processing ? 'Saving…' : 'Save changes'}
                    </button>
                </>
            }
        >
            <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
                <nav aria-label="Sections" className="hidden lg:block">
                    <Link href={admin()} className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
                        <ArrowLeft className="h-4 w-4" /> All content
                    </Link>
                    <ul className="space-y-0.5">
                        {sections.map((item) => (
                            <li key={item.key}>
                                <Link
                                    href={admin(`/content/${item.key}`)}
                                    className={`block rounded-lg px-3 py-1.5 text-sm ${item.key === sectionKey ? 'bg-zinc-200/70 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <form id="content-form" onSubmit={submit} className="min-w-0 space-y-6">
                    <p className="text-sm text-zinc-500">{section.description}</p>
                    {locales.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-zinc-600">Language:</span>
                            {locales.map((code) => (
                                <Link
                                    key={code}
                                    href={admin(`/content/${sectionKey}${code === defaultLocale ? '' : `?locale=${code}`}`)}
                                    className={`rounded-full px-3 py-1 text-sm font-medium ${code === locale ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                >
                                    {languageNames[code] ?? code.toUpperCase()}
                                </Link>
                            ))}
                            {locale !== defaultLocale && <span className="text-xs text-zinc-500">Fields you leave unchanged keep showing the {languageNames[defaultLocale] ?? defaultLocale} text.</span>}
                        </div>
                    )}
                    {errorCount > 0 && (
                        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            Please fix {errorCount === 1 ? 'the highlighted field' : `${errorCount} highlighted fields`} before saving.
                        </div>
                    )}
                    {section.kind === 'list' ? (
                        <ItemList
                            fields={section.fields}
                            value={Array.isArray(value) ? value : []}
                            onChange={setValue}
                            path="value"
                            errors={errors}
                            icons={icons}
                            itemLabel={section.itemLabel}
                        />
                    ) : (
                        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                            <FieldGroup
                                fields={section.fields}
                                value={Array.isArray(value) ? {} : value}
                                onChange={setValue}
                                path="value"
                                errors={errors}
                                icons={icons}
                            />
                        </div>
                    )}
                    <div className="flex justify-end border-t border-zinc-200 pt-6">
                        <button type="submit" disabled={processing} className={buttonClass.primary}>
                            <Save className="h-4 w-4" /> {processing ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
