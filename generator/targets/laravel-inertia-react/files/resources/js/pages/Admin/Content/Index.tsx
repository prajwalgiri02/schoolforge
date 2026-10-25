import { Link } from '@inertiajs/react';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { AdminLayout, inputClass } from '@/admin/AdminLayout';
import { groupSections } from '@/admin/contentGroups';
import { useAdminUrl } from '@/admin/urls';

type SectionSummary = { key: string; label: string; description: string; kind: 'object' | 'list'; count: number | null; editedAt: string | null };

export default function ContentIndex({ sections }: { sections: SectionSummary[] }) {
    const admin = useAdminUrl();
    const [search, setSearch] = useState('');
    const query = search.trim().toLowerCase();
    const visible = groupSections(sections.filter((section) => query === '' || `${section.label} ${section.description}`.toLowerCase().includes(query)));
    const editedCount = sections.filter((section) => section.editedAt).length;

    return (
        <AdminLayout title="Content" description="Everything visitors read on the website. Changes appear on the site as soon as you save them.">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a section" aria-label="Find a section" className={`${inputClass} pl-9`} />
                </div>
                <p className="text-sm text-zinc-500">
                    {sections.length} sections · {editedCount} edited
                </p>
            </div>
            {visible.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">No section matches “{search}”.</div>
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                    {visible.map((group) => (
                        <section key={group.title} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
                                <h2 className="text-base font-semibold">{group.title}</h2>
                                <span className="text-xs text-zinc-500">{group.sections.length}</span>
                            </header>
                            <div className="divide-y divide-zinc-100">
                                {group.sections.map((section) => (
                                    <Link key={section.key} href={admin(`/content/${section.key}`)} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-zinc-50">
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-2 text-sm font-medium">
                                                {section.label}
                                                {section.editedAt && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Edited</span>}
                                            </p>
                                            <p className="truncate text-sm text-zinc-500">{section.description}</p>
                                        </div>
                                        {section.count !== null && <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-zinc-600">{section.count}</span>}
                                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
