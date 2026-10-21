import { Link, router } from '@inertiajs/react';
import { inputClass } from '@admin/AdminLayout';
import { PageHeading, StudioLayout } from '@/studio/StudioLayout';

type Event = { id: number; action: string; description: string; user: string | null; school: { name: string; slug: string } | null; ipAddress: string | null; at: string };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; last_page: number };

type Option = { id: number; name: string };

function formatTime(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function ActivityIndex({ events, filters, schools, users }: { events: Paginated<Event>; filters: { school: number | null; user: number | null }; schools: Option[]; users: Option[] }) {
    const filter = (name: 'school' | 'user', value: string) => router.get('/activity', { ...filters, [name]: value || undefined }, { preserveState: true, preserveScroll: true });

    return (
        <StudioLayout title="Activity log">
            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                <PageHeading title="Activity log" description="Who signed in and what they changed in Studio, newest first. Entries are kept for a year." />
                <div className="mb-4 flex flex-wrap gap-3">
                    <select aria-label="School" value={filters.school ?? ''} onChange={(event) => filter('school', event.target.value)} className={`${inputClass} max-w-xs`}>
                        <option value="">All schools</option>
                        {schools.map((school) => (
                            <option key={school.id} value={school.id}>
                                {school.name}
                            </option>
                        ))}
                    </select>
                    <select aria-label="Person" value={filters.user ?? ''} onChange={(event) => filter('user', event.target.value)} className={`${inputClass} max-w-xs`}>
                        <option value="">Everyone</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>
                {events.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">Nothing recorded yet.</p>
                ) : (
                    <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm">
                        {events.data.map((event) => (
                            <li key={event.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 text-sm">
                                <span className="w-36 shrink-0 text-xs text-zinc-500 tabular-nums">{formatTime(event.at)}</span>
                                <span className="min-w-0 flex-1">
                                    {event.user && <span className="font-medium">{event.user} </span>}
                                    <span className="text-zinc-700">{event.description}</span>
                                    {event.school && (
                                        <Link href={`/projects/${event.school.slug}/content`} className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200">
                                            {event.school.name}
                                        </Link>
                                    )}
                                </span>
                                {event.ipAddress && <span className="font-mono text-xs text-zinc-400">{event.ipAddress}</span>}
                            </li>
                        ))}
                    </ul>
                )}
                {events.last_page > 1 && (
                    <nav className="mt-4 flex flex-wrap gap-1" aria-label="Pages">
                        {events.links.map((link) => (link.url ? <Link key={link.label} href={link.url} preserveScroll className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : null))}
                    </nav>
                )}
            </main>
        </StudioLayout>
    );
}
