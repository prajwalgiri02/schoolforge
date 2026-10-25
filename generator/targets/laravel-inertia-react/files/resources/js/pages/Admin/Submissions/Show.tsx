import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, Save, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';
import { StatusBadge } from './Index';
import { useAdminUrl } from '@/admin/urls';

type Field = { name: string; label: string; type: string; value: string | null; file: { name: string; size: number } | null };

type Submission = { id: number; type: string; reference: string; status: string; name: string; email: string; notes: string | null; created_at: string; reviewed_at: string | null };

function formatSize(bytes: number): string {
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default function SubmissionShow({ submission, label, statuses, fields, publishable }: { submission: Submission; label: string; statuses: string[]; fields: Field[]; publishable: boolean }) {
    const admin = useAdminUrl();
    const form = useForm({ status: submission.status, notes: submission.notes ?? '' });

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.patch(admin(`/submissions/${submission.id}`), { preserveScroll: true });
    };

    const destroy = () => {
        if (window.confirm(`Delete ${submission.reference} and its uploaded files?`)) {
            router.delete(admin(`/submissions/${submission.id}`));
        }
    };

    return (
        <AdminLayout title={`${label} ${submission.reference}`}>
            <Link href={admin(`/submissions?type=${submission.type}`)} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4" /> All {label.toLowerCase()}s
            </Link>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 p-5">
                        <div>
                            <p className="font-mono text-sm font-semibold">{submission.reference}</p>
                            <p className="text-sm text-zinc-500">Received {new Date(submission.created_at).toLocaleString('en')}</p>
                        </div>
                        <StatusBadge status={submission.status} />
                    </header>
                    <dl className="divide-y divide-zinc-100">
                        {fields.map((field) => (
                            <div key={field.name} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[14rem_1fr]">
                                <dt className="text-zinc-500">{field.label}</dt>
                                <dd className="whitespace-pre-line font-medium text-zinc-900">
                                    {field.type === 'file' ? (
                                        field.file ? (
                                            <a href={admin(`/submissions/${submission.id}/files/${field.name}`)} className="inline-flex items-center gap-1.5 text-blue-700 hover:underline">
                                                <Download className="h-4 w-4" /> {field.file.name} <span className="font-normal text-zinc-500">({formatSize(field.file.size)})</span>
                                            </a>
                                        ) : (
                                            <span className="font-normal text-zinc-400">Not uploaded</span>
                                        )
                                    ) : field.type === 'email' && field.value ? (
                                        <a href={`mailto:${field.value}`} className="text-blue-700 hover:underline">
                                            {field.value}
                                        </a>
                                    ) : (
                                        (field.value ?? <span className="font-normal text-zinc-400">—</span>)
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
                <form onSubmit={save} className="h-fit space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div>
                        <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                            Status
                        </label>
                        <select id="status" value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className={inputClass}>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        {publishable && <p className="mt-1.5 text-xs text-zinc-500">Choosing “approved” publishes it on the website.</p>}
                        {!publishable && <p className="mt-1.5 text-xs text-zinc-500">Applicants see this status when they track their application.</p>}
                    </div>
                    <div>
                        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
                            Internal notes
                        </label>
                        <textarea id="notes" rows={5} value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} className={inputClass} />
                        {form.errors.notes && <p className="mt-1 text-sm text-red-600">{form.errors.notes}</p>}
                    </div>
                    <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                        <Save className="h-4 w-4" /> Save
                    </button>
                    <button type="button" onClick={destroy} className={`${buttonClass.danger} w-full`}>
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
