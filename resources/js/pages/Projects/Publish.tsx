import { Link, router, useForm, usePage } from '@inertiajs/react';
import { CircleCheck, Download, ExternalLink, Globe, Inbox, Mail, Trash2, TriangleAlert } from 'lucide-react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { ProjectLayout } from '@/studio/ProjectLayout';
import { FieldError } from '@/studio/StudioLayout';
import type { ProjectSummary, StudioSharedProps } from '@/studio/types';

type Hosting = { publishedAt: string | null; changedSincePublished: boolean; url: string | null; domain: string | null; subdomain: string | null; serverHost: string };

type Submission = { id: number; form: string; reference: string; data: Record<string, string | boolean>; files: string[]; read: boolean; createdAt: string };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; last_page: number };

const formLabels: Record<string, string> = { contact: 'Enquiry', subscribe: 'Alert sign-up', admission: 'Admission', job: 'Job application', alumni: 'Alumni', testimonial: 'Testimonial' };

function formatTime(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function headline(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}

export default function Publish({ project, hosting, submissions, unread }: { project: ProjectSummary; hosting: Hosting; submissions: Paginated<Submission>; unread: number }) {
    const { auth } = usePage<StudioSharedProps>().props;
    const domainForm = useForm({ domain: hosting.domain ?? '' });
    const publishForm = useForm({});
    const canHost = Boolean(hosting.domain || hosting.subdomain);
    const base = `/projects/${project.slug}`;

    const saveDomain = (event: FormEvent) => {
        event.preventDefault();
        domainForm.put(`${base}/domain`, { preserveScroll: true });
    };

    const unpublish = () => {
        if (window.confirm(`Take ${project.name} offline? Visitors will no longer see the website.`)) {
            router.delete(`${base}/publish`, { preserveScroll: true });
        }
    };

    const removeSubmission = (submission: Submission) => {
        if (window.confirm(`Delete ${submission.reference}?`)) {
            router.delete(`${base}/submissions/${submission.id}`, { preserveScroll: true });
        }
    };

    return (
        <ProjectLayout project={project} title="Publish" preview={false}>
            <div className="mx-auto max-w-4xl space-y-6">
                <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="flex items-center gap-2 font-semibold">
                                <Globe className="h-5 w-5" /> Host the website with Studio
                            </h2>
                            <p className="mt-1 max-w-xl text-sm text-zinc-500">Studio serves the published version of the school to visitors, with its pages, search engine sitemap and working forms. Changes you make here go live when you publish again.</p>
                        </div>
                        {hosting.publishedAt ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live</span>
                        ) : (
                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">Not published</span>
                        )}
                    </div>

                    {hosting.publishedAt && (
                        <div className="mt-5 rounded-lg bg-zinc-50 p-4 text-sm">
                            <p className="flex flex-wrap items-center gap-2">
                                <CircleCheck className="h-4 w-4 text-emerald-600" /> Published {formatTime(hosting.publishedAt)} at
                                <a href={hosting.url!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline">
                                    {hosting.url} <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </p>
                            {hosting.changedSincePublished && (
                                <p className="mt-2 flex items-center gap-2 text-amber-800">
                                    <TriangleAlert className="h-4 w-4" /> The school changed since it was published. Publish again to put the changes live.
                                </p>
                            )}
                        </div>
                    )}

                    {auth.user?.canEdit && (
                        <div className="mt-5 flex flex-wrap gap-3">
                            <button type="button" disabled={!canHost || publishForm.processing} onClick={() => publishForm.post(`${base}/publish`, { preserveScroll: true })} className={buttonClass.primary}>
                                {publishForm.processing ? 'Publishing…' : hosting.publishedAt ? 'Publish changes' : 'Publish'}
                            </button>
                            {hosting.publishedAt && (
                                <button type="button" onClick={unpublish} className={buttonClass.danger}>
                                    Unpublish
                                </button>
                            )}
                        </div>
                    )}
                    {!canHost && <p className="mt-3 text-sm text-zinc-500">Set a domain below to publish.</p>}
                </section>

                <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Web address</h2>
                    {hosting.subdomain && (
                        <p className="mt-1 text-sm text-zinc-500">
                            Always available at <span className="font-mono text-zinc-800">{hosting.subdomain}</span>.
                        </p>
                    )}
                    <form onSubmit={saveDomain} className="mt-4 space-y-2">
                        <label htmlFor="domain" className="block text-sm font-medium">
                            School’s own domain
                        </label>
                        <div className="flex flex-wrap gap-3">
                            <input id="domain" value={domainForm.data.domain} onChange={(event) => domainForm.setData('domain', event.target.value)} placeholder="www.yourschool.edu.np" disabled={!auth.user?.canManage} className={`${inputClass} max-w-md flex-1 font-mono`} />
                            {auth.user?.canManage && (
                                <button type="submit" disabled={domainForm.processing} className={buttonClass.secondary}>
                                    Save domain
                                </button>
                            )}
                        </div>
                        <FieldError message={domainForm.errors.domain} />
                        <p className="text-xs text-zinc-500">
                            At the domain’s DNS provider, point the domain (an A record, or a CNAME to <span className="font-mono">{hosting.serverHost}</span>) at this Studio server, and set up HTTPS for it on the server. Both the bare domain and www. work.
                        </p>
                    </form>
                </section>

                <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                        <h2 className="flex items-center gap-2 font-semibold">
                            <Inbox className="h-5 w-5" /> Messages and forms
                        </h2>
                        {unread > 0 && <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-semibold text-white">{unread} new</span>}
                    </div>
                    {submissions.data.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-zinc-500">Enquiries, applications and alert sign-ups from the hosted website appear here, and are emailed to the school’s contact address.</p>
                    ) : (
                        <ul className="divide-y divide-zinc-100">
                            {submissions.data.map((submission) => (
                                <li key={submission.id} className={`px-6 py-4 ${submission.read ? '' : 'bg-indigo-50/40'}`}>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="flex flex-wrap items-center gap-2 text-sm">
                                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">{formLabels[submission.form] ?? headline(submission.form)}</span>
                                            <span className={submission.read ? '' : 'font-semibold'}>{String(submission.data.name ?? submission.data.studentName ?? submission.data.email ?? submission.data.phone ?? submission.reference)}</span>
                                            <span className="text-xs text-zinc-500">
                                                {submission.reference} · {formatTime(submission.createdAt)}
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {typeof submission.data.email === 'string' && (
                                                <a href={`mailto:${submission.data.email}`} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Reply by email" title="Reply by email">
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                            )}
                                            <button type="button" onClick={() => router.patch(`${base}/submissions/${submission.id}`, {}, { preserveScroll: true })} className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100">
                                                {submission.read ? 'Mark unread' : 'Mark read'}
                                            </button>
                                            {auth.user?.canEdit && (
                                                <button type="button" onClick={() => removeSubmission(submission)} className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${submission.reference}`}>
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                                        {Object.entries(submission.data).map(([name, value]) => (
                                            <div key={name} className={name === 'message' ? 'sm:col-span-2' : ''}>
                                                <dt className="inline text-zinc-500">{headline(name)}: </dt>
                                                <dd className="inline whitespace-pre-line break-words">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                    {submission.files.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {submission.files.map((field) => (
                                                <a key={field} href={`${base}/submissions/${submission.id}/files/${field}`} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium hover:bg-zinc-50">
                                                    <Download className="h-3.5 w-3.5" /> {headline(field)}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {submissions.last_page > 1 && (
                        <nav className="flex flex-wrap gap-1 border-t border-zinc-100 px-6 py-3" aria-label="Pages">
                            {submissions.links.map((link) =>
                                link.url ? (
                                    <Link key={link.label} href={link.url} preserveScroll className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : null,
                            )}
                        </nav>
                    )}
                </section>
            </div>
        </ProjectLayout>
    );
}
