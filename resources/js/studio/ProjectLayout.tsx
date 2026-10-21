import { Link, usePage } from '@inertiajs/react';
import { ExternalLink, FileText, Globe, History, LayoutTemplate, Monitor, Paintbrush, RefreshCw, Rocket, Smartphone, Sparkles, Tablet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { StudioLayout, Swatch } from './StudioLayout';
import { targetLabels, type ProjectSummary, type StudioSharedProps } from './types';

const tabs = [
    { key: 'content', label: 'Content', icon: FileText },
    { key: 'design', label: 'Design', icon: Paintbrush },
    { key: 'pages', label: 'Pages', icon: LayoutTemplate },
    { key: 'generate', label: 'Generate', icon: Rocket },
    { key: 'publish', label: 'Publish', icon: Globe },
    { key: 'history', label: 'History', icon: History },
] as const;

const devices = [
    { key: 'desktop', label: 'Desktop', icon: Monitor, width: null },
    { key: 'tablet', label: 'Tablet', icon: Tablet, width: 768 },
    { key: 'phone', label: 'Phone', icon: Smartphone, width: 390 },
] as const;

type Device = (typeof devices)[number]['key'];

/**
 * Workspace for one school: tabs on top, the editor on the left and, on wide
 * screens, a live preview of the website that refreshes after every save.
 */
export function ProjectLayout({
    project,
    title,
    children,
    preview = true,
    previewPath = '',
}: {
    project: ProjectSummary;
    title: string;
    children: ReactNode;
    preview?: boolean;
    previewPath?: string;
}) {
    const url = usePage().url;
    const { auth } = usePage<StudioSharedProps>().props;
    /** School staff look after content, pages and publishing only. */
    const visibleTabs = auth.user?.role === 'school' ? tabs.filter((tab) => ['content', 'pages', 'publish', 'history'].includes(tab.key)) : tabs;
    const [reloads, setReloads] = useState(0);
    const [device, setDevice] = useState<Device>('desktop');
    const frameWidth = devices.find((item) => item.key === device)?.width;
    const previewUrl = `/preview/${project.slug}${previewPath}`;

    return (
        <StudioLayout title={`${title} · ${project.name}`} wide>
            <div className="border-b border-zinc-200 bg-white">
                <div className="mx-auto max-w-[110rem] px-4 pt-6 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Swatch colors={project.colors} className="h-7 w-7" />
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
                                <p className="text-sm text-zinc-500">
                                    {project.themeLabel} theme · {targetLabels[project.target] ?? project.target}
                                </p>
                            </div>
                        </div>
                        <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                            <ExternalLink className="h-4 w-4" /> Open preview
                        </a>
                    </div>
                    <nav className="-mb-px mt-6 flex gap-1 overflow-x-auto" aria-label="Project">
                        {visibleTabs.map((tab) => {
                            const href = `/projects/${project.slug}/${tab.key}`;
                            const active = url.startsWith(href);

                            return (
                                <Link
                                    key={tab.key}
                                    href={href}
                                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
            {project.needsOnboarding && (
                <div className="border-b border-amber-200 bg-amber-50">
                    <div className="mx-auto flex max-w-[110rem] flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-amber-900 sm:px-6">
                        <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> Your website still has starter content. Add your school’s details in a few quick steps.
                        </span>
                        <Link href={`/projects/${project.slug}/welcome`} className="font-semibold underline underline-offset-2 hover:no-underline">
                            Finish setting up
                        </Link>
                    </div>
                </div>
            )}
            <div className={`mx-auto max-w-[110rem] px-4 py-8 sm:px-6 ${preview ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-8' : ''}`}>
                <div className="min-w-0">{children}</div>
                {preview && (
                    <aside className="hidden xl:block">
                        <div className="sticky top-20 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
                                <span className="flex items-center gap-2">
                                    <span className="flex gap-1">
                                        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                                    </span>
                                    Live preview{previewPath ? ` · ${previewPath}` : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                    {devices.map((item) => (
                                        <button key={item.key} type="button" onClick={() => setDevice(item.key)} aria-pressed={device === item.key} aria-label={`${item.label} preview`} title={item.label} className={`rounded p-1.5 ${device === item.key ? 'bg-zinc-200 text-zinc-900' : 'hover:bg-zinc-200'}`}>
                                            <item.icon className="h-3.5 w-3.5" />
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => setReloads((count) => count + 1)} className="ml-1 flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-200" aria-label="Reload preview">
                                        <RefreshCw className="h-3.5 w-3.5" /> Reload
                                    </button>
                                </span>
                            </div>
                            <div className={`h-[calc(100vh-9rem)] overflow-auto ${frameWidth ? 'bg-zinc-100 p-4' : ''}`}>
                                <iframe
                                    key={`${project.updatedAt}-${reloads}-${previewPath}`}
                                    src={previewUrl}
                                    title="Website preview"
                                    style={frameWidth ? { width: frameWidth } : undefined}
                                    className={`h-full bg-white ${frameWidth ? 'mx-auto rounded-xl border border-zinc-300 shadow-lg' : 'w-full'}`}
                                />
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </StudioLayout>
    );
}
