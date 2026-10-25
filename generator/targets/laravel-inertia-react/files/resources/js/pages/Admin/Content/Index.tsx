import { Link } from '@inertiajs/react';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { AdminLayout, inputClass } from '@/admin/AdminLayout';
import { groupSections } from '@/admin/contentGroups';
import { Badge } from '@/admin/ui';
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
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
                    <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a section" aria-label="Find a section" className={`${inputClass} pl-9`} />
                </div>
                <p className="text-sm text-[var(--admin-muted)]">
                    {sections.length} sections · {editedCount} edited
                </p>
            </div>
            {visible.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#c5ccd5] bg-white px-6 py-12 text-center text-sm text-[var(--admin-muted)]">No section matches “{search}”.</div>
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2 lg:gap-8">
                    {visible.map((group) => (
                        <section key={group.title} className="overflow-hidden rounded-[20px] border border-[var(--admin-border)] bg-white">
                            <header className="flex items-center justify-between border-b border-[var(--admin-border)] px-6 py-5">
                                <h2 className="text-xl font-medium text-[var(--admin-heading)]">{group.title}</h2>
                                <span className="text-sm text-[var(--admin-muted)]">{group.sections.length} sections</span>
                            </header>
                            <div className="divide-y divide-[var(--admin-border)]">
                                {group.sections.map((section) => (
                                    <Link key={section.key} href={admin(`/content/${section.key}`)} className="flex items-center gap-4 px-6 py-4 transition hover:bg-[#f8fbfc]">
                                        <div className="min-w-0 flex-1">
                                            <p className="flex items-center gap-2 text-base text-[var(--admin-heading)]">
                                                {section.label}
                                                {section.editedAt && <Badge tone="green">Edited</Badge>}
                                            </p>
                                            <p className="truncate text-sm text-[var(--admin-muted)]">{section.description}</p>
                                        </div>
                                        {section.count !== null && <Badge tone="blue">{section.count}</Badge>}
                                        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" />
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
