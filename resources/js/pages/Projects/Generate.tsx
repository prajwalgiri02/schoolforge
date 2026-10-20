import { router, useForm, usePoll } from '@inertiajs/react';
import { CircleAlert, CircleCheck, Download, FolderOpen, LoaderCircle, Rocket, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, type FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { ProjectLayout } from '@/studio/ProjectLayout';
import { FieldError } from '@/studio/StudioLayout';
import type { ProjectSummary, Target } from '@/studio/types';

type Run = { id: number; target: string; outputPath: string; install: boolean; status: 'queued' | 'running' | 'succeeded' | 'failed'; log: string | null; createdAt: string; finishedAt: string | null };

type Props = {
    project: ProjectSummary;
    validation: { ok: boolean; errors: string[]; warnings: string[]; pageCount: number };
    targets: Target[];
    defaults: { target: string; outputPath: string; isExisting: boolean };
    runs: Run[];
};

const statusStyles: Record<Run['status'], string> = {
    queued: 'bg-zinc-100 text-zinc-700',
    running: 'bg-blue-50 text-blue-700',
    succeeded: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-red-50 text-red-700',
};

function RunLog({ run }: { run: Run }) {
    const logRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
    }, [run.log]);

    return (
        <pre ref={logRef} className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">
            {run.log || (run.status === 'queued' ? 'Waiting for the queue worker… (is `composer run dev` or `php artisan queue:work` running?)' : '')}
        </pre>
    );
}

export default function Generate({ project, validation, targets, defaults, runs }: Props) {
    const form = useForm({ target: defaults.target, output_path: defaults.outputPath, install: false });
    const errors = form.errors as Record<string, string | undefined>;
    const active = runs.some((run) => run.status === 'queued' || run.status === 'running');
    const poll = usePoll(1500, { only: ['runs'] }, { autoStart: false });

    useEffect(() => {
        if (active) {
            poll.start();
        } else {
            poll.stop();
        }
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/projects/${project.slug}/generate`, { preserveScroll: true, onSuccess: () => router.reload({ only: ['runs', 'defaults'] }) });
    };

    return (
        <ProjectLayout project={project} title="Generate" preview={false}>
            <div className="mx-auto max-w-4xl space-y-6">
                <section className={`rounded-xl border p-5 ${validation.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                    {validation.ok ? (
                        <p className="flex items-center gap-2 font-medium text-emerald-800">
                            <CircleCheck className="h-5 w-5" /> Ready to generate: {validation.pageCount} pages.
                        </p>
                    ) : (
                        <>
                            <p className="flex items-center gap-2 font-medium text-red-800">
                                <CircleAlert className="h-5 w-5" /> Fix these before generating:
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-7 text-sm text-red-700">
                                {validation.errors.map((error) => (
                                    <li key={error}>{error}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    {validation.warnings.length > 0 && (
                        <ul className="mt-3 space-y-1 text-sm text-amber-800">
                            {validation.warnings.map((warning) => (
                                <li key={warning} className="flex gap-2">
                                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {warning}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <form onSubmit={submit} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div>
                        <h2 className="font-semibold">Write the website’s codebase</h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            An empty folder gets a brand-new project. A folder that already holds this school’s project is updated with the latest content, theme and components; code you changed by hand there is kept.
                        </p>
                    </div>
                    <fieldset>
                        <legend className="mb-2 text-sm font-medium">Framework</legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {targets.map((target) => (
                                <label key={target.name} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                                    <input type="radio" name="target" checked={form.data.target === target.name} onChange={() => form.setData('target', target.name)} className="mt-0.5" />
                                    {target.label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <div>
                        <label htmlFor="output_path" className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                            <FolderOpen className="h-4 w-4" /> Folder on this computer
                        </label>
                        <input id="output_path" value={form.data.output_path} onChange={(event) => form.setData('output_path', event.target.value)} className={`${inputClass} font-mono`} />
                        <FieldError message={errors.output_path} />
                        {defaults.isExisting && form.data.output_path === defaults.outputPath && <p className="mt-1.5 text-xs text-zinc-500">This folder already contains the project; generating will update it.</p>}
                    </div>
                    <label className="flex items-start gap-3 text-sm">
                        <input type="checkbox" checked={form.data.install} onChange={(event) => form.setData('install', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-zinc-300" />
                        <span>
                            <span className="font-medium">Install dependencies and build</span>
                            <span className="block text-zinc-500">
                                Runs {form.data.target === 'nextjs' ? 'npm install and a production build' : 'composer create-project, migrations, npm install and a production build'}. Takes a few minutes and needs internet access. Only applies to new folders.
                            </span>
                        </span>
                    </label>
                    {errors.config && <p className="text-sm text-red-600">{errors.config}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <a href={`/projects/${project.slug}/config.json`} className={buttonClass.secondary}>
                            <Download className="h-4 w-4" /> Download school.config.json
                        </a>
                        <button type="submit" disabled={form.processing || active || !validation.ok} className={buttonClass.primary}>
                            <Rocket className="h-4 w-4" /> {active ? 'Generating…' : 'Generate'}
                        </button>
                    </div>
                </form>

                {runs.length > 0 && (
                    <section>
                        <h2 className="mb-3 font-semibold">Recent runs</h2>
                        <div className="space-y-4">
                            {runs.map((run, index) => (
                                <article key={run.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                    <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate font-mono text-sm">{run.outputPath}</p>
                                            <p className="text-xs text-zinc-500">
                                                {run.target} · {new Date(run.createdAt).toLocaleString()} {run.install ? '· with install' : ''}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[run.status]}`}>
                                            {(run.status === 'running' || run.status === 'queued') && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                                            {run.status}
                                        </span>
                                    </header>
                                    {(index === 0 || run.status === 'failed') && <RunLog run={run} />}
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-white p-5">
                    <div>
                        <h2 className="font-semibold text-red-700">Delete this school from Studio</h2>
                        <p className="text-sm text-zinc-500">Generated code on disk is not touched. Download the config first if you might need it again.</p>
                    </div>
                    <button
                        type="button"
                        className={buttonClass.danger}
                        onClick={() => window.confirm(`Delete ${project.name} from Studio? This cannot be undone.`) && router.delete(`/projects/${project.slug}`)}
                    >
                        Delete school
                    </button>
                </section>
            </div>
        </ProjectLayout>
    );
}
