import { Link } from '@inertiajs/react';
import { ChevronRight, Mail } from 'lucide-react';
import { AdminLayout } from '@/admin/AdminLayout';

type SectionSummary = { key: string; label: string; description: string; kind: 'object' | 'list'; count: number | null; editedAt: string | null };

type MessageSummary = { id: number; name: string; subject: string; created_at: string; read_at: string | null };

const groups: { title: string; keys: string[] }[] = [
    { title: 'School', keys: ['school', 'about', 'principal', 'contact', 'social'] },
    { title: 'Home page', keys: ['hero', 'announcement', 'stats', 'testimonials'] },
    { title: 'Academics & campus', keys: ['programs', 'facilities', 'faculty', 'achievements', 'gallery'] },
    { title: 'News & admissions', keys: ['news', 'events', 'notices', 'admissions', 'faqs'] },
];

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function Dashboard({
    sections,
    pageCount,
    unreadMessages,
    recentMessages,
}: {
    sections: SectionSummary[];
    pageCount: number;
    unreadMessages: number;
    recentMessages: MessageSummary[];
}) {
    const byKey = Object.fromEntries(sections.map((section) => [section.key, section]));
    const grouped = new Set(groups.flatMap((group) => group.keys));
    const allGroups = [...groups, { title: 'Other', keys: sections.map((section) => section.key).filter((key) => !grouped.has(key)) }].filter((group) => group.keys.length > 0);

    return (
        <AdminLayout title="Website content">
            <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
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
                                            <Link key={key} href={`/admin/content/${key}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-50">
                                                <div className="min-w-0 flex-1">
                                                    <p className="flex items-center gap-2 font-medium">
                                                        {section.label}
                                                        {section.editedAt && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Edited</span>}
                                                    </p>
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
                <aside className="space-y-6">
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-zinc-500">Live website</p>
                        <p className="mt-1 text-2xl font-semibold">{pageCount} pages</p>
                        <p className="mt-2 text-sm text-zinc-500">Changes you save here appear on the website immediately.</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="flex items-center gap-2 font-medium">
                                <Mail className="h-4 w-4" /> Enquiries
                            </p>
                            {unreadMessages > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{unreadMessages} new</span>}
                        </div>
                        {recentMessages.length === 0 ? (
                            <p className="mt-3 text-sm text-zinc-500">No messages yet.</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-zinc-100">
                                {recentMessages.map((message) => (
                                    <li key={message.id} className="py-2.5 text-sm">
                                        <p className={message.read_at ? 'text-zinc-600' : 'font-semibold'}>{message.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {message.subject} · {formatDate(message.created_at)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Link href="/admin/messages" className="mt-3 inline-block text-sm font-medium text-zinc-900 underline-offset-4 hover:underline">
                            View all messages
                        </Link>
                    </div>
                </aside>
            </div>
        </AdminLayout>
    );
}
