import { router, usePage } from '@inertiajs/react';
import { Copy, History as HistoryIcon, LayoutTemplate, RotateCcw, Rocket } from 'lucide-react';
import { buttonClass } from '@admin/AdminLayout';
import { ProjectLayout } from '@/studio/ProjectLayout';
import type { ProjectSummary, StudioSharedProps } from '@/studio/types';

type Activity = { kind: 'version' | 'generation'; id: number; summary: string; user: string | null; at: string };

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function History({ project, activity, latestVersionId }: { project: ProjectSummary; activity: Activity[]; latestVersionId: number | null }) {
    const { auth } = usePage<StudioSharedProps>().props;

    const restore = (item: Activity) => {
        if (window.confirm(`Restore the version from ${formatDate(item.at)}? Your current content is kept in the history.`)) {
            router.post(`/projects/${project.slug}/history/${item.id}/restore`, {}, { preserveScroll: true });
        }
    };

    return (
        <ProjectLayout project={project} title="History">
            {auth.user?.role !== 'school' && (
            <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <button type="button" onClick={() => router.post(`/projects/${project.slug}/duplicate`)} className={buttonClass.secondary}>
                    <Copy className="h-4 w-4" /> Duplicate this school
                </button>
                <button type="button" onClick={() => router.post(`/projects/${project.slug}/template`, {}, { preserveScroll: true })} className={buttonClass.secondary}>
                    <LayoutTemplate className="h-4 w-4" /> {project.isTemplate ? 'Stop using as a template' : 'Use as a template for new schools'}
                </button>
                <p className="w-full text-sm text-zinc-500">Templates appear under “Starting content” when you create a school, with their pages, design and content but the new school’s name.</p>
            </div>
            )}
            <h2 className="mb-3 font-semibold">Activity</h2>
            <ol className="relative space-y-1 border-l border-zinc-200 pl-6">
                {activity.map((item) => (
                    <li key={`${item.kind}-${item.id}`} className="relative rounded-lg p-3 hover:bg-white">
                        <span className={`absolute -left-[1.85rem] top-4 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-zinc-50 ${item.kind === 'generation' ? 'bg-indigo-600 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                            {item.kind === 'generation' ? <Rocket className="h-3 w-3" /> : <HistoryIcon className="h-3 w-3" />}
                        </span>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium">{item.summary}</p>
                                <p className="text-xs text-zinc-500">
                                    {formatDate(item.at)}
                                    {item.user && ` · ${item.user}`}
                                    {item.id === latestVersionId && item.kind === 'version' && ' · current version'}
                                </p>
                            </div>
                            {item.kind === 'version' && item.id !== latestVersionId && (
                                <button type="button" onClick={() => restore(item)} className={buttonClass.secondary}>
                                    <RotateCcw className="h-4 w-4" /> Restore
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </ProjectLayout>
    );
}
