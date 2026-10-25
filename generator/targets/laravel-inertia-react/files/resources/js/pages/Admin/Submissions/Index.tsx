import { Link, router } from '@inertiajs/react';
import { Eye, Inbox, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AdminLayout } from '@/admin/AdminLayout';
import { Avatar, Card, EmptyState, IconLink, Pagination, StatusBadge, filterClass, table } from '@/admin/ui';
import { useAdminUrl } from '@/admin/urls';

type Submission = { id: number; reference: string; status: string; name: string; email: string; data: Record<string, string>; reviewed_at: string | null; created_at: string };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; total: number };

type FormType = { type: string; label: string; statuses: string[]; open: number };

const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

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
        <AdminLayout title="Applications" description="Admission forms and other applications sent from the website.">
            <div className="mb-6 inline-flex max-w-full flex-wrap gap-1 rounded-[12px] bg-[#eef0f3] p-1">
                {types.map((item) => (
                    <Link
                        key={item.type}
                        href={admin(`/submissions?type=${item.type}`)}
                        aria-current={item.type === type ? 'page' : undefined}
                        className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition ${item.type === type ? 'bg-[var(--admin-primary)] text-white shadow-sm' : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'}`}
                    >
                        {item.label}
                        {item.open > 0 && <span className={`rounded-full px-1.5 text-xs ${item.type === type ? 'bg-white/20' : 'bg-white text-[var(--admin-primary)]'}`}>{item.open}</span>}
                    </Link>
                ))}
            </div>
            <Card
                title={`${current.label}s`}
                padded={false}
                actions={
                    <>
                        <form onSubmit={submitSearch} className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
                            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or reference" aria-label="Search" className={`${filterClass} w-64 max-w-full pl-9`} />
                        </form>
                        <select aria-label="Filter by status" value={status ?? ''} onChange={(event) => visit({ status: event.target.value || null })} className={`${filterClass} capitalize`}>
                            <option value="">All statuses</option>
                            {current.statuses.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    </>
                }
            >
                {submissions.data.length === 0 ? (
                    <EmptyState icon={Inbox} title="Nothing here yet">
                        {current.label}s sent through the website will appear here.
                    </EmptyState>
                ) : (
                    <div className={`${table.wrap} pb-3`}>
                        <table className={table.table}>
                            <thead className={table.head}>
                                <tr>
                                    <th className={table.th}>Reference</th>
                                    <th className={table.th}>Name</th>
                                    <th className={table.th}>Details</th>
                                    <th className={table.th}>Status</th>
                                    <th className={table.th}>Received</th>
                                    <th className={`${table.th} text-right`}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.data.map((submission) => {
                                    const name = submission.data.studentName ?? submission.name;

                                    return (
                                        <tr key={submission.id} className={`${table.row} ${submission.reviewed_at ? '' : 'bg-[#f8fbfc]'}`}>
                                            <td className={`${table.td} whitespace-nowrap`}>
                                                <Link href={admin(`/submissions/${submission.id}`)} className="font-medium text-[var(--admin-heading)] hover:text-[var(--admin-primary)] hover:underline">
                                                    {submission.reference}
                                                </Link>
                                            </td>
                                            <td className={table.td}>
                                                <span className="flex items-center gap-3">
                                                    <Avatar name={name} />
                                                    <span className="min-w-0">
                                                        <span className={`block ${submission.reviewed_at ? '' : 'font-medium text-[var(--admin-heading)]'}`}>{name}</span>
                                                        <span className="block text-xs">{submission.email}</span>
                                                    </span>
                                                </span>
                                            </td>
                                            <td className={table.td}>{submission.data.grade ?? submission.data.position ?? submission.data.batch ?? submission.data.role ?? ''}</td>
                                            <td className={table.td}>
                                                <StatusBadge status={submission.status} />
                                            </td>
                                            <td className={`${table.td} whitespace-nowrap`}>{formatDate(submission.created_at)}</td>
                                            <td className={`${table.td} text-right`}>
                                                <IconLink href={admin(`/submissions/${submission.id}`)} label={`Open ${submission.reference}`} icon={Eye} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
            <Pagination links={submissions.links} />
        </AdminLayout>
    );
}
