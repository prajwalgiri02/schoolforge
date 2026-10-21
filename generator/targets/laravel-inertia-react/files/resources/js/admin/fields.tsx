import { useHttp } from '@inertiajs/react';
import { ArrowDown, ArrowUp, FileText, FolderOpen, ImageUp, Plus, Search, Trash2, X } from 'lucide-react';
import { createContext, useContext, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { buttonClass, inputClass } from './AdminLayout';
import type { FieldDefinition, Item, Value } from './types';

type Errors = Record<string, string | undefined>;

/**
 * Where image fields upload files. Apps embedding these editors elsewhere can provide their own endpoint.
 */
export const UploadUrlContext = createContext('/admin/uploads');

/**
 * Where the "Library" picker lists earlier uploads (JSON). Apps embedding these editors can provide their own endpoint.
 */
export const MediaLibraryUrlContext = createContext('/admin/media');

type LibraryItem = { url: string; name: string; kind: 'image' | 'document'; size: number };

/**
 * A dialog listing earlier uploads of one kind, so the same photo or PDF can be
 * reused without uploading it again.
 */
function MediaPicker({ kind, onPick, onClose }: { kind: LibraryItem['kind']; onPick: (url: string) => void; onClose: () => void }) {
    const libraryUrl = useContext(MediaLibraryUrlContext);
    const [items, setItems] = useState<LibraryItem[] | null>(null);
    const [query, setQuery] = useState('');
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        fetch(libraryUrl, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((response) => (response.ok ? response.json() : []))
            .then((list: LibraryItem[]) => setItems(list.filter((item) => item.kind === kind)))
            .catch(() => setItems([]));

        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeRef.current();
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [libraryUrl, kind]);

    const shown = (items ?? []).filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label="Media library" className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center gap-3 border-b border-zinc-200 p-4">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search uploads" aria-label="Search uploads" className={`${inputClass} pl-9`} />
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto p-4">
                    {items === null ? (
                        <p className="py-10 text-center text-sm text-zinc-500">Loading…</p>
                    ) : shown.length === 0 ? (
                        <p className="py-10 text-center text-sm text-zinc-500">{items.length === 0 ? `No ${kind === 'image' ? 'images' : 'documents'} uploaded yet.` : 'Nothing matches your search.'}</p>
                    ) : (
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {shown.map((item) => (
                                <li key={item.url}>
                                    <button type="button" onClick={() => onPick(item.url)} className="group w-full overflow-hidden rounded-lg border border-zinc-200 text-left hover:border-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900">
                                        <span className="flex aspect-[4/3] items-center justify-center bg-zinc-100">
                                            {item.kind === 'image' ? <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <FileText className="h-8 w-8 text-zinc-400" />}
                                        </span>
                                        <span className="block truncate px-2 py-1.5 text-xs text-zinc-600 group-hover:text-zinc-900">{item.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

type FieldProps = {
    field: FieldDefinition;
    value: Value;
    onChange: (value: Value) => void;
    path: string;
    errors: Errors;
    icons: string[];
};

function errorFor(errors: Errors, path: string): string | undefined {
    return errors[path] ?? Object.entries(errors).find(([key]) => key.startsWith(`${path}.`))?.[1];
}

function Label({ field, htmlFor }: { field: FieldDefinition; htmlFor?: string }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-800">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
        </label>
    );
}

function Help({ field, error }: { field: FieldDefinition; error?: string }) {
    if (error) {
        return <p className="mt-1.5 text-sm text-red-600">{error}</p>;
    }

    return field.help ? <p className="mt-1.5 text-xs text-zinc-500">{field.help}</p> : null;
}

/**
 * Edits a list of strings as text: one entry per line, or per blank-line-separated paragraph.
 */
function TextListInput({ id, value, onChange, paragraphs }: { id: string; value: Value; onChange: (value: string[]) => void; paragraphs: boolean }) {
    const separator = paragraphs ? /\n\s*\n/ : /\n/;
    const [text, setText] = useState(() => (Array.isArray(value) ? value.join(paragraphs ? '\n\n' : '\n') : ''));

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);
        onChange(
            event.target.value
                .split(separator)
                .map((entry) => entry.trim())
                .filter(Boolean),
        );
    };

    return <textarea id={id} rows={paragraphs ? 8 : 4} value={text} onChange={handleChange} className={inputClass} />;
}

/**
 * Uploads an image (shown as a thumbnail) or, with `document`, a PDF or office
 * file for the Downloads page (shown by name).
 */
function ImageInput({ id, value, onChange, document = false }: { id: string; value: Value; onChange: (value: string) => void; document?: boolean }) {
    const fileInput = useRef<HTMLInputElement>(null);
    const uploadUrl = useContext(UploadUrlContext);
    const upload = useHttp<{ file: File | null }, { url: string }>({ file: null });
    const src = typeof value === 'string' ? value : '';
    const [picking, setPicking] = useState(false);

    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        upload.transform(() => ({ file }));

        try {
            const response = await upload.post(uploadUrl);
            onChange(response.url);
        } catch {
            // Validation errors are exposed through upload.errors.
        }
    };

    return (
        <div className="flex items-start gap-4">
            <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-100">
                {document ? (
                    <FileText className={`h-7 w-7 ${src ? 'text-zinc-700' : 'text-zinc-400'}`} />
                ) : src ? (
                    <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                    <ImageUp className="h-6 w-6 text-zinc-400" />
                )}
            </div>
            <div className="flex-1 space-y-2">
                <input id={id} type="text" value={src} placeholder={document ? 'https://… or /files/form.pdf' : 'https://… or /images/photo.jpg'} onChange={(event) => onChange(event.target.value)} className={inputClass} />
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={buttonClass.secondary} disabled={upload.processing} onClick={() => fileInput.current?.click()}>
                        <ImageUp className="h-4 w-4" /> {upload.processing ? 'Uploading…' : document ? 'Upload file' : 'Upload image'}
                    </button>
                    <button type="button" className={buttonClass.secondary} onClick={() => setPicking(true)}>
                        <FolderOpen className="h-4 w-4" /> Library
                    </button>
                    {src && (
                        <button type="button" className={buttonClass.danger} onClick={() => onChange('')}>
                            Remove
                        </button>
                    )}
                    <input ref={fileInput} type="file" accept={document ? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt' : 'image/*'} className="hidden" onChange={handleFile} />
                </div>
                {upload.errors.file && <p className="text-sm text-red-600">{upload.errors.file}</p>}
            </div>
            {picking && (
                <MediaPicker
                    kind={document ? 'document' : 'image'}
                    onClose={() => setPicking(false)}
                    onPick={(url) => {
                        onChange(url);
                        setPicking(false);
                    }}
                />
            )}
        </div>
    );
}

export function Field({ field, value, onChange, path, errors, icons }: FieldProps) {
    const id = useId();
    const error = errorFor(errors, path);
    const text = typeof value === 'string' || typeof value === 'number' ? String(value) : '';

    switch (field.type) {
        case 'boolean':
            return (
                <div>
                    <label className="flex items-center gap-3 text-sm font-medium text-zinc-800">
                        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                        {field.label}
                    </label>
                    <Help field={field} error={error} />
                </div>
            );
        case 'textarea':
            return (
                <div>
                    <Label field={field} htmlFor={id} />
                    <textarea id={id} rows={4} value={text} onChange={(event) => onChange(event.target.value)} className={inputClass} />
                    <Help field={field} error={error} />
                </div>
            );
        case 'strings':
        case 'paragraphs':
            return (
                <div>
                    <Label field={field} htmlFor={id} />
                    <TextListInput id={id} value={value} onChange={onChange} paragraphs={field.type === 'paragraphs'} />
                    <Help field={field} error={error} />
                </div>
            );
        case 'image':
        case 'file':
            return (
                <div>
                    <Label field={field} htmlFor={id} />
                    <ImageInput id={id} value={value} onChange={onChange} document={field.type === 'file'} />
                    <Help field={field} error={error} />
                </div>
            );
        case 'icon':
            return (
                <div>
                    <Label field={field} htmlFor={id} />
                    <select id={id} value={text} onChange={(event) => onChange(event.target.value)} className={inputClass}>
                        <option value="">Default</option>
                        {icons.map((icon) => (
                            <option key={icon} value={icon}>
                                {icon}
                            </option>
                        ))}
                    </select>
                    <Help field={field} error={error} />
                </div>
            );
        case 'link': {
            const link = (value && typeof value === 'object' && !Array.isArray(value) ? value : {}) as { label?: string; href?: string };

            return (
                <fieldset>
                    <legend className="mb-1.5 text-sm font-medium text-zinc-800">{field.label}</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input aria-label={`${field.label} text`} placeholder="Button text" value={link.label ?? ''} onChange={(event) => onChange({ ...link, label: event.target.value })} className={inputClass} />
                        <input aria-label={`${field.label} link`} placeholder="/admissions or https://…" value={link.href ?? ''} onChange={(event) => onChange({ ...link, href: event.target.value })} className={inputClass} />
                    </div>
                    <Help field={field} error={error} />
                </fieldset>
            );
        }
        case 'items':
            return (
                <fieldset>
                    <legend className="mb-2 text-sm font-medium text-zinc-800">{field.label}</legend>
                    <ItemList fields={field.fields ?? []} itemLabel={field.fields?.find((child) => child.type === 'text')?.name} value={Array.isArray(value) ? (value as Item[]) : []} onChange={onChange} path={path} errors={errors} icons={icons} compact />
                    <Help field={field} />
                </fieldset>
            );
        default:
            return (
                <div>
                    <Label field={field} htmlFor={id} />
                    <input id={id} type={field.type === 'date' ? 'date' : 'text'} value={text} onChange={(event) => onChange(event.target.value)} className={inputClass} />
                    <Help field={field} error={error} />
                </div>
            );
    }
}

export function FieldGroup({ fields, value, onChange, path, errors, icons }: { fields: FieldDefinition[]; value: Item; onChange: (value: Item) => void; path: string; errors: Errors; icons: string[] }) {
    return (
        <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
                <div key={field.name} className={['textarea', 'paragraphs', 'items', 'image', 'file', 'link', 'strings'].includes(field.type) ? 'md:col-span-2' : ''}>
                    <Field field={field} value={value[field.name]} onChange={(next) => onChange({ ...value, [field.name]: next })} path={`${path}.${field.name}`} errors={errors} icons={icons} />
                </div>
            ))}
        </div>
    );
}

/**
 * Repeating group of items with add, remove and reorder controls.
 * Items get a stable client-side key so reordering does not reset text inputs.
 */
export function ItemList({
    fields,
    value,
    onChange,
    path,
    errors,
    icons,
    itemLabel,
    compact = false,
}: {
    fields: FieldDefinition[];
    value: Item[];
    onChange: (value: Item[]) => void;
    path: string;
    errors: Errors;
    icons: string[];
    itemLabel?: string;
    compact?: boolean;
}) {
    const keys = useRef<string[]>([]);
    const counter = useRef(0);

    while (keys.current.length < value.length) {
        keys.current.push(`item-${counter.current++}`);
    }

    const move = (from: number, to: number) => {
        const next = [...value];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        const [key] = keys.current.splice(from, 1);
        keys.current.splice(to, 0, key);
        onChange(next);
    };

    const removeAt = (index: number) => {
        keys.current.splice(index, 1);
        onChange(value.filter((_, position) => position !== index));
    };

    return (
        <div className="space-y-3">
            {value.map((item, index) => {
                const heading = (itemLabel && typeof item[itemLabel] === 'string' && (item[itemLabel] as string)) || `Item ${index + 1}`;
                const hasError = Boolean(errorFor(errors, `${path}.${index}`));

                return (
                    <div key={keys.current[index]} className={`rounded-xl border bg-white ${hasError ? 'border-red-300' : 'border-zinc-200'} ${compact ? 'p-4' : 'p-5 shadow-sm'}`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-zinc-700">
                                <span className="mr-2 text-zinc-400">{index + 1}.</span>
                                {heading}
                            </p>
                            <div className="flex shrink-0 items-center gap-1">
                                <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                                <button type="button" aria-label="Move down" disabled={index === value.length - 1} onClick={() => move(index, index + 1)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30">
                                    <ArrowDown className="h-4 w-4" />
                                </button>
                                <button type="button" aria-label="Remove" onClick={() => removeAt(index)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <FieldGroup fields={fields} value={item} onChange={(next) => onChange(value.map((current, position) => (position === index ? next : current)))} path={`${path}.${index}`} errors={errors} icons={icons} />
                    </div>
                );
            })}
            <button type="button" className={buttonClass.secondary} onClick={() => onChange([...value, {}])}>
                <Plus className="h-4 w-4" /> Add {compact ? 'row' : 'item'}
            </button>
        </div>
    );
}
