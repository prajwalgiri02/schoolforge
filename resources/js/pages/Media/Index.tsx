import { router } from '@inertiajs/react';
import { FileText, ImageIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { buttonClass } from '@admin/AdminLayout';
import { PageHeading, StudioLayout } from '@/studio/StudioLayout';

type Item = { path: string; url: string; name: string; kind: 'image' | 'document'; size: number; modified: number; usedBy: string[] };

function formatSize(bytes: number): string {
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function MediaIndex({ items }: { items: Item[] }) {
    const [kind, setKind] = useState<'all' | Item['kind'] | 'unused'>('all');
    const shown = items.filter((item) => (kind === 'all' ? true : kind === 'unused' ? item.usedBy.length === 0 : item.kind === kind));

    const destroy = (item: Item) => {
        if (window.confirm(`Delete ${item.name}?`)) {
            router.delete('/media', { data: { path: item.path }, preserveScroll: true });
        }
    };

    return (
        <StudioLayout title="Media">
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <PageHeading title="Media library" description="Every image and document uploaded in Studio. Reuse them from any image or file field with the Library button; generating a school copies the files it uses into its codebase." />
                <div className="mb-6 flex flex-wrap gap-2">
                    {(
                        [
                            ['all', `All (${items.length})`],
                            ['image', 'Images'],
                            ['document', 'Documents'],
                            ['unused', 'Not used'],
                        ] as const
                    ).map(([value, label]) => (
                        <button key={value} type="button" onClick={() => setKind(value)} aria-pressed={kind === value} className={`rounded-full px-4 py-1.5 text-sm font-medium ${kind === value ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50'}`}>
                            {label}
                        </button>
                    ))}
                </div>
                {shown.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
                        <ImageIcon className="mx-auto h-8 w-8 text-zinc-400" />
                        <p className="mt-3">Nothing here yet. Uploads from the content and page editors appear here.</p>
                    </div>
                ) : (
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                        {shown.map((item) => (
                            <li key={item.path} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                                <a href={item.url} target="_blank" rel="noreferrer" className="flex aspect-[4/3] items-center justify-center bg-zinc-100">
                                    {item.kind === 'image' ? <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <FileText className="h-10 w-10 text-zinc-400" />}
                                </a>
                                <div className="space-y-1 p-3">
                                    <p className="truncate text-sm font-medium" title={item.name}>
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-zinc-500">{formatSize(item.size)}</p>
                                    <p className="truncate text-xs text-zinc-500" title={item.usedBy.join(', ')}>
                                        {item.usedBy.length > 0 ? `Used by ${item.usedBy.join(', ')}` : 'Not used'}
                                    </p>
                                    {item.usedBy.length === 0 && (
                                        <button type="button" onClick={() => destroy(item)} className={`${buttonClass.danger} -ml-3 mt-1`}>
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </StudioLayout>
    );
}
