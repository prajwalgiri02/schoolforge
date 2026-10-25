import { Link, router, usePage } from '@inertiajs/react';
import { Plus, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { AdminLayout, buttonClass } from '@/admin/AdminLayout';
import { groupOf } from '@/admin/contentGroups';
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
    const page = usePage();
    const errors = page.props.errors as Record<string, string | undefined>;
    const [adding] = useState(() => Array.isArray(initialValue) && new URLSearchParams(page.url.split('?')[1] ?? '').has('add'));
    const [value, setValue] = useState<Item | Item[]>(() => (adding && Array.isArray(initialValue) ? [{}, ...initialValue] : initialValue));
    const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialValue));
    const [processing, setProcessing] = useState(false);
    const [version, setVersion] = useState(0);
    const isDirty = JSON.stringify(value) !== savedSnapshot;

    useEffect(() => {
        if (adding) {
            const url = new URL(window.location.href);
            url.searchParams.delete('add');
            window.history.replaceState(window.history.state, '', url);
        }
    }, [adding]);

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', warn);

        return () => window.removeEventListener('beforeunload', warn);
    }, [isDirty]);

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        return router.on('before', (event) => {
            if (event.detail.visit.method === 'get' && !window.confirm('You have unsaved changes. Leave without saving them?')) {
                event.preventDefault();
            }
        });
    }, [isDirty]);

    const submit = (event?: FormEvent) => {
        event?.preventDefault();
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

    const discard = () => {
        setValue(JSON.parse(savedSnapshot) as Item | Item[]);
        setVersion((current) => current + 1);
    };

    const reset = () => {
        if (window.confirm(`Undo every change made to “${section.label}” here and go back to the original content?`)) {
            router.delete(admin(`/content/${sectionKey}${query}`), { preserveScroll: true });
        }
    };

    const group = groupOf(sectionKey);
    const tabs = group && group.keys.length > 1 ? group.keys.flatMap((key) => sections.filter((item) => item.key === key)) : [];
    const errorCount = Object.keys(errors).length;
    const saveLabel = processing ? 'Saving…' : 'Save changes';

    return (
        <AdminLayout
            title={tabs.length > 0 && group ? group.title : section.label}
            description={tabs.length > 0 && group ? group.description : section.description}
        >
            <form id="content-form" onSubmit={submit} className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 shadow-[inset_0_-1px_0_var(--admin-border)]">
                    {tabs.length > 0 ? (
                        <nav aria-label={`${group?.title} sections`} className="flex min-w-0 max-w-full gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
                            {tabs.map((tab) => (
                                <Link
                                    key={tab.key}
                                    href={admin(`/content/${tab.key}${query}`)}
                                    aria-current={tab.key === sectionKey ? 'page' : undefined}
                                    className={`whitespace-nowrap border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition ${tab.key === sectionKey ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-[var(--admin-muted)] hover:border-[var(--admin-border)] hover:text-[var(--admin-heading)]'}`}
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </nav>
                    ) : (
                        <span />
                    )}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        {isEdited && (
                            <button type="button" onClick={reset} className={buttonClass.secondary}>
                                <RotateCcw className="h-4 w-4" /> Restore original
                            </button>
                        )}
                        <button type="submit" disabled={processing || !isDirty} className={buttonClass.primary}>
                            <Save className="h-4 w-4" /> {isDirty ? saveLabel : 'Saved'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    {tabs.length > 0 ? (
                        <p className="text-sm text-[var(--admin-muted)]">
                            <span className="font-medium text-[var(--admin-heading)]">{section.label}: </span>
                            {section.description}
                        </p>
                    ) : (
                        <span />
                    )}
                    {locales.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--admin-muted)]">Language</span>
                            <div className="inline-flex rounded-[10px] bg-[#eef0f3] p-0.5">
                                {locales.map((code) => (
                                    <Link
                                        key={code}
                                        href={admin(`/content/${sectionKey}${code === defaultLocale ? '' : `?locale=${code}`}`)}
                                        aria-current={code === locale ? 'true' : undefined}
                                        className={`rounded-[8px] px-3 py-1.5 text-sm font-medium transition ${code === locale ? 'bg-[var(--admin-primary)] text-[var(--admin-on-primary)] shadow-sm' : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'}`}
                                    >
                                        {languageNames[code] ?? code.toUpperCase()}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {locale !== defaultLocale && (
                    <p className="rounded-[12px] bg-[var(--admin-primary-soft)] px-4 py-2.5 text-sm text-[var(--admin-heading)]">
                        Only fill in what you want translated. Anything you leave as it is keeps showing the {languageNames[defaultLocale] ?? defaultLocale} text.
                    </p>
                )}

                {adding && isDirty && (
                    <div role="status" className="flex items-center gap-2 rounded-[12px] border border-[var(--admin-primary-soft)] bg-[var(--admin-primary-soft)] px-4 py-3 text-sm text-[var(--admin-heading)]">
                        <Plus className="h-4 w-4 shrink-0" /> A new item is ready at the top. Fill it in and save.
                    </div>
                )}
                {errorCount > 0 && (
                    <div role="alert" className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        Please fix {errorCount === 1 ? 'the highlighted field' : `${errorCount} highlighted fields`} before saving.
                    </div>
                )}

                {section.kind === 'list' ? (
                    <ItemList
                        key={version}
                        fields={section.fields}
                        value={Array.isArray(value) ? value : []}
                        onChange={setValue}
                        path="value"
                        errors={errors}
                        icons={icons}
                        itemLabel={section.itemLabel}
                        collapsible
                        addLabel="Add new"
                    />
                ) : (
                    <div key={version} className="rounded-[20px] border border-[var(--admin-border)] bg-white p-6">
                        <FieldGroup fields={section.fields} value={Array.isArray(value) ? {} : value} onChange={setValue} path="value" errors={errors} icons={icons} />
                    </div>
                )}

                {isDirty && (
                    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--admin-border)] bg-white/95 px-5 py-3 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.25)] backdrop-blur">
                        <p className="text-sm font-medium text-[var(--admin-heading)]">You have unsaved changes</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={discard} className={buttonClass.secondary}>
                                Discard
                            </button>
                            <button type="submit" disabled={processing} className={buttonClass.primary}>
                                <Save className="h-4 w-4" /> {saveLabel}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </AdminLayout>
    );
}
