import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarPlus, ChevronRight, Circle, CircleCheck, History, ImagePlus, Inbox, Mail, Megaphone, Newspaper, PenLine, Users, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AdminLayout, buttonClass } from '@/admin/AdminLayout';
import type { SharedProps } from '@/admin/types';
import { useAdminUrl } from '@/admin/urls';
import { StatusBadge } from './Submissions/Index';

type Stat = { key: string; label: string; value: number | string | null };

type Step = { key: string; label: string; section: string; done: boolean };

type MessageSummary = { id: number; name: string; subject: string; created_at: string; read_at: string | null };

type SubmissionSummary = { id: number; reference: string; name: string; status: string; form: string; created_at: string; reviewed_at: string | null };

type Edit = { key: string; label: string; locale: string | null; updatedAt: string };

const statStyles: Record<string, { icon: LucideIcon; tint: string; path: string; link: string }> = {
    messages: { icon: Mail, tint: 'bg-blue-50 text-blue-600', path: '/messages', link: 'Read messages' },
    submissions: { icon: Inbox, tint: 'bg-amber-50 text-amber-600', path: '/submissions', link: 'Review applications' },
    updated: { icon: History, tint: 'bg-emerald-50 text-emerald-600', path: '/content', link: 'Edit content' },
    subscribers: { icon: Users, tint: 'bg-violet-50 text-violet-600', path: '/alerts', link: 'Email subscribers' },
};

const quickActions: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'news', label: 'Post news', icon: Newspaper },
    { key: 'events', label: 'Add an event', icon: CalendarPlus },
    { key: 'notices', label: 'Add a notice', icon: Megaphone },
    { key: 'gallery', label: 'Add photos', icon: ImagePlus },
];

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function statValue(stat: Stat): string {
    if (typeof stat.value === 'number') {
        return stat.value.toLocaleString('en-IN');
    }

    return stat.value ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(stat.value)) : 'Not yet';
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
                <h2 className="text-base font-semibold">{title}</h2>
                {action}
            </header>
            {children}
        </section>
    );
}

function Empty({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
    return (
        <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 max-w-sm text-sm text-zinc-500">{children}</p>
        </div>
    );
}

export default function Dashboard({
    stats,
    checklist,
    pageCount,
    sectionCount,
    editedCount,
    recentMessages,
    recentSubmissions,
    recentEdits,
}: {
    stats: Stat[];
    checklist: Step[];
    pageCount: number;
    sectionCount: number;
    editedCount: number;
    recentMessages: MessageSummary[];
    recentSubmissions: SubmissionSummary[];
    recentEdits: Edit[];
}) {
    const { auth, schoolName } = usePage<SharedProps>().props;
    const admin = useAdminUrl();
    const doneCount = checklist.filter((step) => step.done).length;
    const inboxEmpty = recentMessages.length === 0 && recentSubmissions.length === 0;
    const viewAll = (path: string) => (
        <Link href={admin(path)} className="-my-2 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900">
            View all
        </Link>
    );

    return (
        <AdminLayout
            title={auth.user ? `Welcome back, ${auth.user.name}` : 'Dashboard'}
            description={`What is happening with ${schoolName}’s website.`}
            actions={
                <Link href={admin('/content')} className={buttonClass.primary}>
                    <PenLine className="h-4 w-4" /> Edit content
                </Link>
            }
        >
            {doneCount < checklist.length && (
                <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold">Get your website ready</h2>
                            <p className="mt-1 text-sm text-zinc-500">The things visitors look for first. Each one takes a minute or two.</p>
                        </div>
                        <p className="text-sm font-medium text-zinc-600">
                            {doneCount} of {checklist.length} done
                        </p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100" role="progressbar" aria-label="Website setup" aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={doneCount}>
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                    </div>
                    <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {checklist.map((step) => (
                            <li key={step.key} className={step.done ? 'hidden sm:block' : undefined}>
                                <Link
                                    href={admin(`/content/${step.section}`)}
                                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition ${step.done ? 'border-zinc-100 text-zinc-500 hover:bg-zinc-50' : 'border-zinc-200 font-medium hover:border-zinc-300 hover:bg-zinc-50'}`}
                                >
                                    {step.done ? <CircleCheck className="h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="h-5 w-5 shrink-0 text-zinc-300" />}
                                    <span className="flex-1">
                                        {step.label}
                                        {step.done && <span className="sr-only"> (done)</span>}
                                    </span>
                                    {!step.done && <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {stats.map((stat) => {
                    const style = statStyles[stat.key] ?? statStyles.messages;
                    const Icon = style.icon;

                    return (
                        <Link key={stat.key} href={admin(style.path)} className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                                <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${style.tint}`}>
                                    <Icon className="h-4 w-4" />
                                </span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{statValue(stat)}</p>
                            <p className="mt-auto flex items-center gap-1 pt-3 text-xs font-medium text-zinc-600 group-hover:text-zinc-900 sm:text-sm">
                                {style.link} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                            </p>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    {inboxEmpty ? (
                        <Panel title="Inbox">
                            <Empty icon={Inbox}>No enquiries or applications yet. Messages and forms sent from the website appear here, and the menu shows how many are new.</Empty>
                        </Panel>
                    ) : (
                        <>
                            <Panel title="Recent enquiries" action={viewAll('/messages')}>
                                {recentMessages.length === 0 ? (
                                    <Empty icon={Mail}>No enquiries yet. Messages sent from the website’s contact form appear here.</Empty>
                                ) : (
                                    <ul className="divide-y divide-zinc-100">
                                        {recentMessages.map((message) => (
                                            <li key={message.id}>
                                                <Link href={admin('/messages')} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-zinc-50">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">{message.name.slice(0, 1).toUpperCase()}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`flex items-center gap-2 truncate text-sm ${message.read_at ? 'text-zinc-700' : 'font-semibold'}`}>
                                                            {!message.read_at && (
                                                                <>
                                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-hidden="true" />
                                                                    <span className="sr-only">Unread:</span>
                                                                </>
                                                            )}
                                                            {message.name}
                                                        </p>
                                                        <p className="truncate text-sm text-zinc-500">{message.subject}</p>
                                                    </div>
                                                    <time dateTime={message.created_at} className="shrink-0 text-xs text-zinc-500">
                                                        {formatDate(message.created_at)}
                                                    </time>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Panel>
                            <Panel title="Recent applications" action={viewAll('/submissions')}>
                                {recentSubmissions.length === 0 ? (
                                    <Empty icon={Inbox}>No applications yet. Admission and other forms sent from the website appear here.</Empty>
                                ) : (
                                    <ul className="divide-y divide-zinc-100">
                                        {recentSubmissions.map((submission) => (
                                            <li key={submission.id}>
                                                <Link href={admin(`/submissions/${submission.id}`)} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-zinc-50">
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`truncate text-sm ${submission.reviewed_at ? 'text-zinc-700' : 'font-semibold'}`}>{submission.name}</p>
                                                        <p className="truncate text-sm text-zinc-500">
                                                            {submission.form} · {submission.reference}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={submission.status} />
                                                    <time dateTime={submission.created_at} className="hidden shrink-0 text-xs text-zinc-500 sm:block">
                                                        {formatDate(submission.created_at)}
                                                    </time>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Panel>
                        </>
                    )}
                    <Panel title="Recently edited" action={viewAll('/content')}>
                        {recentEdits.length === 0 ? (
                            <Empty icon={PenLine}>Nothing edited yet. The website shows its original content until you change it here.</Empty>
                        ) : (
                            <ul className="divide-y divide-zinc-100">
                                {recentEdits.map((edit) => (
                                    <li key={`${edit.locale}:${edit.key}`}>
                                        <Link href={admin(`/content/${edit.key}${edit.locale ? `?locale=${edit.locale}` : ''}`)} className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition hover:bg-zinc-50">
                                            <span className="flex min-w-0 items-center gap-2">
                                                <span className="truncate font-medium">{edit.label}</span>
                                                {edit.locale && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium uppercase text-zinc-600">{edit.locale}</span>}
                                            </span>
                                            <time dateTime={edit.updatedAt} className="shrink-0 text-xs text-zinc-500">
                                                {formatDate(edit.updatedAt)}
                                            </time>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                <div className="order-first space-y-6 xl:order-none">
                    <Panel title="Quick actions">
                        <div className="grid grid-cols-2 gap-3 p-4">
                            {quickActions.map((action) => {
                                const Icon = action.icon;

                                return (
                                    <Link
                                        key={action.key}
                                        href={admin(`/content/${action.key}?add=1`)}
                                        className="flex flex-col items-start gap-3 rounded-lg border border-zinc-200 p-3.5 text-sm font-medium transition hover:border-zinc-300 hover:bg-zinc-50"
                                    >
                                        <Icon className="h-5 w-5 text-zinc-500" />
                                        {action.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </Panel>
                    <Panel title="Website" action={viewAll('/website')}>
                        <dl className="grid grid-cols-2 divide-x divide-zinc-100">
                            <div className="px-5 py-4">
                                <dt className="text-xs font-medium text-zinc-500">Pages</dt>
                                <dd className="mt-1 text-2xl font-semibold tabular-nums">{pageCount}</dd>
                            </div>
                            <div className="px-5 py-4">
                                <dt className="text-xs font-medium text-zinc-500">Sections edited</dt>
                                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                                    {editedCount}
                                    <span className="text-base font-normal text-zinc-500"> / {sectionCount}</span>
                                </dd>
                            </div>
                        </dl>
                    </Panel>
                </div>
            </div>
        </AdminLayout>
    );
}
