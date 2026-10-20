import { Link, useForm } from '@inertiajs/react';
import { FileUp, Plus, School } from 'lucide-react';
import { useRef } from 'react';
import { buttonClass } from '@admin/AdminLayout';
import { PageHeading, StudioLayout, Swatch } from '@/studio/StudioLayout';
import { targetLabels, type ProjectSummary } from '@/studio/types';

function timeAgo(value: string | null): string {
    if (!value) {
        return '';
    }

    const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
    ];
    const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    for (const [unit, size] of units) {
        if (seconds >= size) {
            return format.format(-Math.floor(seconds / size), unit);
        }
    }

    return 'just now';
}

export default function ProjectsIndex({ projects }: { projects: ProjectSummary[] }) {
    const fileInput = useRef<HTMLInputElement>(null);
    const importForm = useForm<{ file: File | null }>({ file: null });

    const importFile = (file: File | undefined) => {
        if (!file) {
            return;
        }

        importForm.transform(() => ({ file }));
        importForm.post('/projects/import', { forceFormData: true });
    };

    return (
        <StudioLayout title="Schools">
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <PageHeading
                    title="School websites"
                    description="Each school has its own content, theme and pages. Edit them here, preview live, then generate a Next.js or Laravel codebase."
                    actions={
                        <>
                            <button type="button" className={buttonClass.secondary} onClick={() => fileInput.current?.click()} disabled={importForm.processing}>
                                <FileUp className="h-4 w-4" /> Import config
                            </button>
                            <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(event) => importFile(event.target.files?.[0])} />
                            <Link href="/projects/create" className={buttonClass.primary}>
                                <Plus className="h-4 w-4" /> New school
                            </Link>
                        </>
                    }
                />
                {importForm.errors.file && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{importForm.errors.file}</div>}
                {projects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
                        <School className="mx-auto h-10 w-10 text-zinc-400" />
                        <h2 className="mt-4 text-lg font-semibold">No schools yet</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">Create your first school website. You can start from sample content and replace it with the school’s own.</p>
                        <Link href="/projects/create" className={`${buttonClass.primary} mt-6`}>
                            <Plus className="h-4 w-4" /> New school
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <Link key={project.slug} href={`/projects/${project.slug}/content`} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="relative h-28" style={{ background: `linear-gradient(135deg, ${project.colors.primary ?? '#334155'}, ${project.colors.secondary ?? '#0f172a'})` }}>
                                    <span className="absolute bottom-0 left-6 h-1.5 w-16 rounded-t" style={{ background: project.colors.accent ?? '#f59e0b' }} />
                                    <span className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700">{targetLabels[project.target] ?? project.target}</span>
                                </div>
                                <div className="p-6">
                                    <h2 className="font-semibold group-hover:text-indigo-700">{project.name}</h2>
                                    <div className="mt-3 flex items-center justify-between text-sm text-zinc-500">
                                        <span className="flex items-center gap-2">
                                            <Swatch colors={project.colors} className="h-4 w-4" />
                                            {project.themeLabel}
                                        </span>
                                        <span>{timeAgo(project.updatedAt)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </StudioLayout>
    );
}
