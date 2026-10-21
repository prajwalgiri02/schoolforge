import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { ProjectLayout } from '@/studio/ProjectLayout';
import type { ProjectSummary } from '@/studio/types';

type SectionSummary = { key: string; label: string; description: string; kind: 'object' | 'list'; count: number | null; filled: boolean };

const groups: { title: string; keys: string[] }[] = [
    { title: 'School', keys: ['school', 'about', 'principal', 'contact', 'social', 'seo'] },
    { title: 'Home page', keys: ['hero', 'announcement', 'stats', 'testimonials'] },
    { title: 'Academics & campus', keys: ['programs', 'facilities', 'faculty', 'achievements'] },
    { title: 'Gallery & media', keys: ['gallery', 'albums', 'videos'] },
    { title: 'News & admissions', keys: ['news', 'events', 'notices', 'admissions', 'faqs'] },
];

export default function ContentIndex({ project, sections }: { project: ProjectSummary; sections: SectionSummary[] }) {
    const byKey = Object.fromEntries(sections.map((section) => [section.key, section]));
    const grouped = new Set(groups.flatMap((group) => group.keys));
    const allGroups = [...groups, { title: 'Other', keys: sections.map((section) => section.key).filter((key) => !grouped.has(key)) }].filter((group) => group.keys.length > 0);

    return (
        <ProjectLayout project={project} title="Content">
            <p className="mb-6 text-sm text-zinc-500">Everything the website says. Sections left empty are hidden from the site automatically.</p>
            <div className="space-y-8">
                {allGroups.map((group) => (
                    <section key={group.title}>
                        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{group.title}</h2>
                        <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            {group.keys
                                .filter((key) => byKey[key])
                                .map((key) => {
                                    const section = byKey[key];

                                    return (
                                        <Link key={key} href={`/projects/${project.slug}/content/${key}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-50">
                                            <span className={`h-2 w-2 shrink-0 rounded-full ${section.filled ? 'bg-emerald-500' : 'bg-zinc-300'}`} title={section.filled ? 'Has content' : 'Empty'} />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium">{section.label}</p>
                                                <p className="truncate text-sm text-zinc-500">{section.description}</p>
                                            </div>
                                            {section.count !== null && <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">{section.count}</span>}
                                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                                        </Link>
                                    );
                                })}
                        </div>
                    </section>
                ))}
            </div>
        </ProjectLayout>
    );
}
