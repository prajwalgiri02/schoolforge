import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { AdminLayout } from '@/admin/AdminLayout';
import { groupSections } from '@/admin/contentGroups';
import { Badge, IconTile } from '@/admin/ui';
import { useAdminUrl } from '@/admin/urls';

type SectionSummary = { key: string; label: string; description: string; kind: 'object' | 'list'; count: number | null; editedAt: string | null };

export default function ContentIndex({ sections }: { sections: SectionSummary[] }) {
    const admin = useAdminUrl();

    return (
        <AdminLayout title="Content" description="Everything on the website, by section. You can also open each section from the Content menu on the left.">
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
                {groupSections(sections).map((group) => (
                    <section key={group.title} className="rounded-[20px] border border-[var(--admin-border)] bg-white">
                        <Link href={admin(`/content/${group.sections[0].key}`)} className="group flex items-center gap-4 border-b border-[var(--admin-border)] px-5 py-4">
                            <IconTile icon={group.icon} size="sm" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-lg font-semibold text-[var(--admin-heading)] group-hover:text-[var(--admin-primary)]">{group.title}</span>
                                <span className="block text-sm text-[var(--admin-muted)]">{group.description}</span>
                            </span>
                            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--admin-muted)] group-hover:text-[var(--admin-primary)]" />
                        </Link>
                        <ul className="divide-y divide-[var(--admin-border)]">
                            {group.sections.map((section) => (
                                <li key={section.key}>
                                    <Link href={admin(`/content/${section.key}`)} className="flex min-h-12 items-center gap-3 px-5 py-2.5 text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-heading)]">
                                        <span className="flex-1">{section.label}</span>
                                        {section.editedAt && <Badge tone="green">Changed</Badge>}
                                        {section.count !== null && <Badge tone="primary">{section.count === 1 ? '1 item' : `${section.count} items`}</Badge>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </AdminLayout>
    );
}
