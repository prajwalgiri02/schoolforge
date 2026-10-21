import { Link, router, usePage } from '@inertiajs/react';
import { Activity, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { buttonClass } from '@admin/AdminLayout';
import { PageHeading, StudioLayout } from '@/studio/StudioLayout';
import type { StudioSharedProps } from '@/studio/types';

type Status = 'ok' | 'warning' | 'failing' | 'down';

type Check = { id: number; status: Status; http_status: number | null; response_ms: number | null; checks: { name: string; status: string; message: string }[] | null; error: string | null; created_at: string };

type Site = { name: string; slug: string; target: string; url: string | null; latest: Check | null; history: { status: Status; at: string }[]; uptime: number | null };

const statusStyle: Record<Status, { label: string; dot: string; badge: string }> = {
    ok: { label: 'Up', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    warning: { label: 'Needs attention', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-800' },
    failing: { label: 'Failing', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
    down: { label: 'Down', dot: 'bg-red-600', badge: 'bg-red-100 text-red-800' },
};

function formatTime(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function StatusIndex({ sites }: { sites: Site[] }) {
    const { auth } = usePage<StudioSharedProps>().props;
    const [checking, setChecking] = useState<string | null>(null);
    const monitored = sites.filter((site) => site.url);
    const unmonitored = sites.filter((site) => !site.url);

    const check = (site: Site) => {
        setChecking(site.slug);
        router.post(`/status/${site.slug}`, {}, { preserveScroll: true, onFinish: () => setChecking(null) });
    };

    return (
        <StudioLayout title="Status">
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <PageHeading
                    title="Website status"
                    description="Studio checks each live school website every five minutes through its health page and emails owners when one goes down or comes back. Run php artisan schedule:work (or a cron entry) for the checks to happen."
                />
                {monitored.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
                        <Activity className="mx-auto h-8 w-8 text-zinc-400" />
                        <p className="mt-3">No school has a live site URL yet. Set it under Content → SEO → Site URL once the website is online.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {monitored.map((site) => {
                            const style = site.latest ? statusStyle[site.latest.status] : null;
                            const problems = (site.latest?.checks ?? []).filter((item) => item.status !== 'ok');

                            return (
                                <li key={site.slug} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="flex flex-wrap items-center gap-2 font-semibold">
                                                <Link href={`/projects/${site.slug}`} className="hover:underline">
                                                    {site.name}
                                                </Link>
                                                {style ? <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>{style.label}</span> : <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Not checked yet</span>}
                                            </p>
                                            <a href={site.url!} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 truncate text-sm text-zinc-500 hover:text-zinc-900">
                                                {site.url} <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-6 text-sm">
                                            <div className="text-right">
                                                <p className="font-semibold tabular-nums">{site.uptime === null ? '–' : `${site.uptime}%`}</p>
                                                <p className="text-xs text-zinc-500">up, last 24 h</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold tabular-nums">{site.latest?.response_ms != null ? `${site.latest.response_ms} ms` : '–'}</p>
                                                <p className="text-xs text-zinc-500">{site.latest ? formatTime(site.latest.created_at) : 'never'}</p>
                                            </div>
                                            {auth.user?.canEdit && (
                                                <button type="button" onClick={() => check(site)} disabled={checking === site.slug} className={`${buttonClass.secondary} whitespace-nowrap`}>
                                                    <RefreshCw className={`h-4 w-4 ${checking === site.slug ? 'animate-spin' : ''}`} /> Check now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {site.history.length > 0 && (
                                        <div className="mt-4 flex h-6 items-stretch gap-0.5" aria-label="Recent checks, oldest first">
                                            {site.history.map((item, index) => (
                                                <span key={index} title={`${statusStyle[item.status].label} · ${formatTime(item.at)}`} className={`w-full max-w-2 rounded-sm ${statusStyle[item.status].dot}`} />
                                            ))}
                                        </div>
                                    )}
                                    {(problems.length > 0 || site.latest?.error) && (
                                        <ul className="mt-4 space-y-1 rounded-lg bg-zinc-50 p-3 text-sm">
                                            {problems.map((item) => (
                                                <li key={item.name} className="flex gap-2">
                                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusStyle[item.status as Status]?.dot ?? 'bg-zinc-400'}`} />
                                                    <span>
                                                        <span className="font-medium capitalize">{item.name.replace(/_/g, ' ')}</span>: {item.message}
                                                    </span>
                                                </li>
                                            ))}
                                            {site.latest?.error && <li className="text-zinc-600">{site.latest.error}</li>}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
                {unmonitored.length > 0 && monitored.length > 0 && (
                    <p className="mt-8 text-sm text-zinc-500">
                        Not monitored (no site URL): {unmonitored.map((site) => site.name).join(', ')}.
                    </p>
                )}
            </main>
        </StudioLayout>
    );
}
