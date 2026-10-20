import { Link, usePage } from '@inertiajs/react';
import { ExternalLink, FileText, LayoutTemplate, Paintbrush, RefreshCw, Rocket } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { StudioLayout, Swatch } from './StudioLayout';
import { targetLabels, type ProjectSummary } from './types';

const tabs = [
    { key: 'content', label: 'Content', icon: FileText },
    { key: 'design', label: 'Design', icon: Paintbrush },
    { key: 'pages', label: 'Pages', icon: LayoutTemplate },
    { key: 'generate', label: 'Generate', icon: Rocket },
] as const;

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
    const [reloads, setReloads] = useState(0);
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
                        {tabs.map((tab) => {
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
                                <button type="button" onClick={() => setReloads((count) => count + 1)} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-200" aria-label="Reload preview">
                                    <RefreshCw className="h-3.5 w-3.5" /> Reload
                                </button>
                            </div>
                            <iframe key={`${project.updatedAt}-${reloads}-${previewPath}`} src={previewUrl} title="Website preview" className="h-[calc(100vh-9rem)] w-full" />
                        </div>
                    </aside>
                )}
            </div>
        </StudioLayout>
    );
}
