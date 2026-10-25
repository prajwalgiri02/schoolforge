import { Link, router } from '@inertiajs/react';
import { Inbox, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AdminLayout, inputClass } from '@/admin/AdminLayout';
import { useAdminUrl } from '@/admin/urls';

type Submission = { id: number; reference: string; status: string; name: string; email: string; data: Record<string, string>; reviewed_at: string | null; created_at: string };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; total: number };

type FormType = { type: string; label: string; statuses: string[]; open: number };

const statusColors: Record<string, string> = {
    received: 'bg-blue-50 text-blue-700',
    pending: 'bg-blue-50 text-blue-700',
    reviewing: 'bg-amber-50 text-amber-700',
    interview: 'bg-violet-50 text-violet-700',
    accepted: 'bg-green-50 text-green-700',
    approved: 'bg-green-50 text-green-700',
    hired: 'bg-green-50 text-green-700',
    waitlisted: 'bg-zinc-100 text-zinc-700',
    rejected: 'bg-red-50 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[status] ?? 'bg-zinc-100 text-zinc-700'}`}>{status}</span>;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function pageLabel(label: string): string {
    return label.replace('&laquo;', '«').replace('&raquo;', '»');
}

export default function SubmissionsIndex({ types, type, status, search, submissions }: { types: FormType[]; type: string; status: string | null; search: string | null; submissions: Paginated<Submission> }) {
    const admin = useAdminUrl();
    const current = types.find((item) => item.type === type)!;
    const [query, setQuery] = useState(search ?? '');
    const visit = (params: Record<string, string | null>) => router.get(admin('/submissions'), Object.fromEntries(Object.entries({ type, status, search: query || null, ...params }).filter(([, value]) => value)), { preserveState: true, preserveScroll: true });
    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        visit({});
    };

    return (
        <AdminLayout title="Applications">
            <div className="mb-6 flex flex-wrap gap-2">
                {types.map((item) => (
                    <Link key={item.type} href={admin(`/submissions?type=${item.type}`)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${item.type === type ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50'}`}>
                        {item.label}
                        {item.open > 0 && <span className="ml-2 rounded-full bg-blue-600 px-1.5 text-xs text-white">{item.open}</span>}
                    </Link>
                ))}
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <select aria-label="Filter by status" value={status ?? ''} onChange={(event) => visit({ status: event.target.value || null })} className={`${inputClass} w-auto`}>
                    <option value="">All statuses</option>
                    {current.statuses.map((value) => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </select>
                <form onSubmit={submitSearch} className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or reference" aria-label="Search" className={`${inputClass} pl-9`} />
                </form>
            </div>
            {submissions.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
                    <Inbox className="mx-auto h-8 w-8 text-zinc-400" />
                    <p className="mt-3">Nothing here yet. {current.label}s sent through the website will appear here.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Reference</th>
                                <th className="px-4 py-3 font-semibold">Name</th>
                                <th className="hidden px-4 py-3 font-semibold md:table-cell">Details</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Received</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {submissions.data.map((submission) => (
                                <tr key={submission.id} className={submission.reviewed_at ? '' : 'bg-blue-50/40'}>
                                    <td className="px-4 py-3 font-mono text-xs">
                                        <Link href={admin(`/submissions/${submission.id}`)} className="font-semibold text-zinc-900 hover:underline">
                                            {submission.reference}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{submission.data.studentName ?? submission.name}</p>
                                        <p className="text-xs text-zinc-500">{submission.email}</p>
                                    </td>
                                    <td className="hidden px-4 py-3 text-zinc-600 md:table-cell">{submission.data.grade ?? submission.data.position ?? submission.data.batch ?? submission.data.role ?? ''}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={submission.status} />
                                    </td>
                                    <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">{formatDate(submission.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {submissions.links.length > 3 && (
                <nav aria-label="Pagination" className="mt-8 flex flex-wrap justify-center gap-1">
                    {submissions.links.map((link, index) =>
                        link.url ? (
                            <Link key={index} href={link.url} preserveScroll className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                                {pageLabel(link.label)}
                            </Link>
                        ) : (
                            <span key={index} className="px-3 py-1.5 text-sm text-zinc-300">
                                {pageLabel(link.label)}
                            </span>
                        ),
                    )}
                </nav>
            )}
        </AdminLayout>
    );
}
