import { Link } from '@inertiajs/react';
import { CalendarDays, CalendarPlus, ChevronRight, Circle, CircleCheck, Eye, FileText, History, ImagePlus, Inbox, Mail, Megaphone, Newspaper, PenLine, Users, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { AdminLayout, buttonClass } from '@/admin/AdminLayout';
import { Avatar, Badge, Card, EmptyState, IconLink, IconTile, StatusBadge, table, type Tone } from '@/admin/ui';
import { useAdminUrl } from '@/admin/urls';

type Stat = { key: string; label: string; value: number | string | null; hint: string };

type Step = { key: string; label: string; section: string; done: boolean };

type Month = { month: string; enquiries: number; applications: number };

type Count = { key: string; label: string; value: number };

type MessageSummary = { id: number; name: string; email: string; subject: string; created_at: string; read_at: string | null; replied_at: string | null };

type SubmissionSummary = { id: number; reference: string; name: string; status: string; form: string; created_at: string; reviewed_at: string | null };

const statStyles: Record<string, { icon: LucideIcon; tone: Tone; path: string }> = {
    messages: { icon: Mail, tone: 'primary', path: '/messages' },
    submissions: { icon: Inbox, tone: 'orange', path: '/submissions' },
    updated: { icon: History, tone: 'green', path: '/content' },
    subscribers: { icon: Users, tone: 'accent', path: '/alerts' },
};

const summaryStyles: Record<string, { icon: LucideIcon; tone: Tone; path: string }> = {
    pages: { icon: FileText, tone: 'primary', path: '/website' },
    news: { icon: Newspaper, tone: 'orange', path: '/content/news' },
    events: { icon: CalendarDays, tone: 'accent', path: '/content/events' },
    notices: { icon: Megaphone, tone: 'red', path: '/content/notices' },
    gallery: { icon: ImagePlus, tone: 'green', path: '/content/gallery' },
};

const quickActions: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'news', label: 'Post news', icon: Newspaper },
    { key: 'events', label: 'Add an event', icon: CalendarPlus },
    { key: 'notices', label: 'Add a notice', icon: Megaphone },
    { key: 'gallery', label: 'Add photos', icon: ImagePlus },
];

const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

function statValue(stat: Stat): string {
    if (typeof stat.value === 'number') {
        return stat.value.toLocaleString('en-IN');
    }

    return stat.value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(stat.value)) : 'Not yet';
}

function messageStatus(message: MessageSummary) {
    if (message.replied_at) {
        return <Badge tone="green">Replied</Badge>;
    }

    return message.read_at ? <Badge tone="primary">Read</Badge> : <Badge tone="orange">New</Badge>;
}

/** Smooth line through the points (Catmull-Rom converted to Bézier curves), never dipping below `floor`. */
function curve(points: [number, number][], floor: number): string {
    return points
        .map(([x, y], index) => {
            if (index === 0) {
                return `M${x},${y}`;
            }

            const [x0, y0] = points[index - 2] ?? points[index - 1];
            const [x1, y1] = points[index - 1];
            const [x3, y3] = points[index + 1] ?? [x, y];

            return `C${x1 + (x - x0) / 6},${Math.min(floor, y1 + (y - y0) / 6)} ${x - (x3 - x1) / 6},${Math.min(floor, y - (y3 - y1) / 6)} ${x},${y}`;
        })
        .join(' ');
}

function ActivityChart({ activity }: { activity: Month[] }) {
    const id = useId();
    const frame = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(640);
    const [height, left, right, top, bottom] = [width < 480 ? 220 : 260, 36, 12, 16, 30];

    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));

        if (frame.current) {
            observer.observe(frame.current);
        }

        return () => observer.disconnect();
    }, []);

    const peak = Math.max(4, ...activity.flatMap((month) => [month.enquiries, month.applications]));
    const ceiling = Math.ceil(peak / 4) * 4;
    const x = (index: number) => left + (index * (width - left - right)) / Math.max(1, activity.length - 1);
    const y = (value: number) => top + (1 - value / ceiling) * (height - top - bottom);
    const series = (key: 'enquiries' | 'applications') => activity.map((month, index): [number, number] => [x(index), y(month[key])]);
    const area = (points: [number, number][]) => `${curve(points, y(0))} L${x(activity.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
    const monthName = (month: string) => new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(new Date(`${month}-01T12:00:00`)).toUpperCase();
    const enquiries = series('enquiries');
    const applications = series('applications');

    return (
        <div ref={frame}>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Enquiries and applications in the last six months">
            <defs>
                <linearGradient id={`${id}-enquiries`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0.04" />
                </linearGradient>
                <linearGradient id={`${id}-applications`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity="0.04" />
                </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((tick) => (
                <g key={tick}>
                    <line x1={left} x2={width - right} y1={y((ceiling / 4) * tick)} y2={y((ceiling / 4) * tick)} stroke="var(--admin-border)" strokeDasharray={tick === 0 ? undefined : '4 4'} />
                    <text x={left - 10} y={y((ceiling / 4) * tick) + 4} textAnchor="end" className="fill-[var(--admin-muted)] text-[12px]">
                        {(ceiling / 4) * tick}
                    </text>
                </g>
            ))}
            {activity.map((month, index) => (
                <text key={month.month} x={x(index)} y={height - 6} textAnchor="middle" className="fill-[var(--admin-muted)] text-[12px] tracking-wider">
                    {monthName(month.month)}
                </text>
            ))}
            <path d={area(applications)} fill={`url(#${id}-applications)`} />
            <path d={curve(applications, y(0))} fill="none" stroke="var(--admin-accent)" strokeWidth="2" />
            <path d={area(enquiries)} fill={`url(#${id}-enquiries)`} />
            <path d={curve(enquiries, y(0))} fill="none" stroke="var(--admin-primary)" strokeWidth="2.5" />
            {enquiries.map(([pointX, pointY], index) => (
                <circle key={index} cx={pointX} cy={pointY} r="4" fill="white" stroke="var(--admin-primary)" strokeWidth="2">
                    <title>{`${monthName(activity[index].month)}: ${activity[index].enquiries} enquiries, ${activity[index].applications} applications`}</title>
                </circle>
            ))}
        </svg>
        </div>
    );
}

export default function Dashboard({
    stats,
    checklist,
    activity,
    summary,
    recentMessages,
    recentSubmissions,
}: {
    stats: Stat[];
    checklist: Step[];
    activity: Month[];
    summary: Count[];
    recentMessages: MessageSummary[];
    recentSubmissions: SubmissionSummary[];
}) {
    const admin = useAdminUrl();
    const doneCount = checklist.filter((step) => step.done).length;
    const quiet = activity.every((month) => month.enquiries === 0 && month.applications === 0);
    const viewAll = (path: string) => (
        <Link href={admin(path)} className="text-sm font-medium text-[var(--admin-primary)] hover:underline">
            View all
        </Link>
    );

    return (
        <AdminLayout
            title="Dashboard"
            description="What is happening on your website."
            actions={
                <>
                    {quickActions.map((action) => {
                        const Icon = action.icon;

                        return (
                            <Link key={action.key} href={admin(`/content/${action.key}?add=1`)} className={`${buttonClass.secondary} max-sm:basis-[calc(50%-0.375rem)] max-sm:px-2`}>
                                <Icon className="h-4 w-4" strokeWidth={1.75} /> {action.label}
                            </Link>
                        );
                    })}
                    <Link href={admin('/content')} className={`${buttonClass.primary} max-sm:w-full`}>
                        <PenLine className="h-4 w-4" /> Edit content
                    </Link>
                </>
            }
        >
            <div className="space-y-6 lg:space-y-8">
                {doneCount < checklist.length && (
                    <Card
                        title="Get your website ready"
                        actions={
                            <span className="text-sm font-medium text-[var(--admin-muted)]">
                                {doneCount} of {checklist.length} done
                            </span>
                        }
                    >
                        <div className="-mt-2 mb-5 h-2 overflow-hidden rounded-full bg-[#eef0f3]" role="progressbar" aria-label="Website setup" aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={doneCount}>
                            <div className="h-full rounded-full bg-[#31b057] transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                        </div>
                        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {checklist.map((step) => (
                                <li key={step.key} className={step.done ? 'hidden sm:block' : undefined}>
                                    <Link
                                        href={admin(`/content/${step.section}`)}
                                        className={`flex min-h-12 items-center gap-3 rounded-[12px] border px-4 py-3 text-sm transition ${step.done ? 'border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]' : 'border-[var(--admin-border)] font-medium text-[var(--admin-heading)] hover:border-[var(--admin-primary)] hover:bg-[var(--admin-primary-soft)]'}`}
                                    >
                                        {step.done ? <CircleCheck className="h-5 w-5 shrink-0 text-[#31b057]" /> : <Circle className="h-5 w-5 shrink-0 text-[#c5ccd5]" />}
                                        <span className="flex-1">
                                            {step.label}
                                            {step.done && <span className="sr-only"> (done)</span>}
                                        </span>
                                        {!step.done && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" />}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => {
                        const style = statStyles[stat.key] ?? statStyles.messages;

                        return (
                            <Link key={stat.key} href={admin(style.path)} className="flex min-h-[110px] items-center gap-4 rounded-[20px] border border-[var(--admin-border)] bg-white px-5 py-4 transition hover:border-[var(--admin-primary)] hover:shadow-[0_16px_22px_rgba(0,0,0,0.05)]">
                                <IconTile icon={style.icon} tone={style.tone} />
                                <span className="min-w-0 leading-tight">
                                    <span className="block text-sm font-light tracking-tight text-[var(--admin-heading)]">{stat.label}</span>
                                    <span className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight text-[var(--admin-heading)]">{statValue(stat)}</span>
                                    <span className="mt-1 block truncate text-xs font-medium text-[var(--admin-muted)]">{stat.hint}</span>
                                </span>
                            </Link>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
                    <Card
                        title="Overview"
                        actions={
                            <span className="flex items-center gap-4 text-sm text-[var(--admin-heading)]">
                                <span className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--admin-primary)]" /> Enquiries
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--admin-accent)]" /> Applications
                                </span>
                            </span>
                        }
                    >
                        <ActivityChart activity={activity} />
                        {quiet && <p className="mt-2 text-center text-sm text-[var(--admin-muted)]">Nothing received yet. Enquiries and applications sent from the website will show here month by month.</p>}
                    </Card>
                    <Card title="Website at a glance">
                        <ul className="-my-2 divide-y divide-[var(--admin-border)]">
                            {summary.map((item) => {
                                const style = summaryStyles[item.key] ?? summaryStyles.pages;

                                return (
                                    <li key={item.key}>
                                        <Link href={admin(style.path)} className="flex items-center gap-3 py-3 text-base text-[var(--admin-heading)] transition hover:text-[var(--admin-primary)]">
                                            <IconTile icon={style.icon} tone={style.tone} size="sm" />
                                            <span className="flex-1">{item.label}</span>
                                            <span className="font-semibold tabular-nums">{item.value.toLocaleString('en-IN')}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </Card>
                </div>

                <Card title="Recent enquiries" actions={viewAll('/messages')} padded={false}>
                    {recentMessages.length === 0 ? (
                        <EmptyState icon={Mail} title="No enquiries yet">
                            Messages sent from the website’s contact form appear here.
                        </EmptyState>
                    ) : (
                        <div className={`${table.wrap} pb-3`}>
                            <table className={table.table}>
                                <thead className={table.head}>
                                    <tr>
                                        <th className={table.th}>Name</th>
                                        <th className={table.th}>Subject</th>
                                        <th className={table.th}>Status</th>
                                        <th className={table.th}>Received</th>
                                        <th className={`${table.th} text-right`}>
                                            <span className="sr-only">Open</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentMessages.map((message) => (
                                        <tr key={message.id} className={table.row}>
                                            <td className={table.td}>
                                                <span className="flex items-center gap-3">
                                                    <Avatar name={message.name} />
                                                    <span className={message.read_at ? '' : 'font-medium text-[var(--admin-heading)]'}>{message.name}</span>
                                                </span>
                                            </td>
                                            <td className={`${table.td} max-w-[18rem] truncate`}>{message.subject}</td>
                                            <td className={table.td}>{messageStatus(message)}</td>
                                            <td className={`${table.td} whitespace-nowrap`}>{formatDate(message.created_at)}</td>
                                            <td className={`${table.td} text-right`}>
                                                <IconLink href={admin('/messages')} label={`Open the message from ${message.name}`} icon={Eye} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                <Card title="Recent applications" actions={viewAll('/submissions')} padded={false}>
                    {recentSubmissions.length === 0 ? (
                        <EmptyState icon={Inbox} title="No applications yet">
                            Admission and other forms sent from the website appear here.
                        </EmptyState>
                    ) : (
                        <div className={`${table.wrap} pb-3`}>
                            <table className={table.table}>
                                <thead className={table.head}>
                                    <tr>
                                        <th className={table.th}>Reference</th>
                                        <th className={table.th}>Name</th>
                                        <th className={table.th}>Form</th>
                                        <th className={table.th}>Status</th>
                                        <th className={table.th}>Received</th>
                                        <th className={`${table.th} text-right`}>
                                            <span className="sr-only">Open</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSubmissions.map((submission) => (
                                        <tr key={submission.id} className={table.row}>
                                            <td className={`${table.td} whitespace-nowrap font-medium text-[var(--admin-heading)]`}>{submission.reference}</td>
                                            <td className={table.td}>
                                                <span className="flex items-center gap-3">
                                                    <Avatar name={submission.name} />
                                                    <span className={submission.reviewed_at ? '' : 'font-medium text-[var(--admin-heading)]'}>{submission.name}</span>
                                                </span>
                                            </td>
                                            <td className={table.td}>{submission.form}</td>
                                            <td className={table.td}>
                                                <StatusBadge status={submission.status} />
                                            </td>
                                            <td className={`${table.td} whitespace-nowrap`}>{formatDate(submission.created_at)}</td>
                                            <td className={`${table.td} text-right`}>
                                                <IconLink href={admin(`/submissions/${submission.id}`)} label={`Open ${submission.reference}`} icon={Eye} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
