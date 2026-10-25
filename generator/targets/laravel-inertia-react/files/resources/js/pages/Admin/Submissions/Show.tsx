import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, Save, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';
import { Avatar, Card, StatusBadge } from '@/admin/ui';
import { useAdminUrl } from '@/admin/urls';

type Field = { name: string; label: string; type: string; value: string | null; file: { name: string; size: number } | null };

type Submission = { id: number; type: string; reference: string; status: string; name: string; email: string; notes: string | null; created_at: string; reviewed_at: string | null };

function formatSize(bytes: number): string {
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

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
        <AdminLayout
            title={`${label} ${submission.reference}`}
            actions={
                <Link href={admin(`/submissions?type=${submission.type}`)} className={buttonClass.secondary}>
                    <ArrowLeft className="h-4 w-4" /> All {label.toLowerCase()}s
                </Link>
            }
        >
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
                <Card>
                    <div className="mb-6 flex flex-wrap items-center gap-4">
                        <Avatar name={submission.name} size="lg" />
                        <div className="min-w-0 flex-1">
                            <p className="text-xl font-medium text-[var(--admin-heading)]">{submission.name}</p>
                            <p className="text-base text-[var(--admin-muted)]">
                                {submission.reference} · received {formatDate(submission.created_at)}
                            </p>
                        </div>
                        <StatusBadge status={submission.status} />
                    </div>
                    <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                        {fields.map((field) => (
                            <div key={field.name} className="border-b border-[var(--admin-border)] py-4">
                                <dt className="text-sm text-[var(--admin-muted)]">{field.label}</dt>
                                <dd className="mt-1 whitespace-pre-line break-words text-base text-[var(--admin-heading)]">
                                    {field.type === 'file' ? (
                                        field.file ? (
                                            <a href={admin(`/submissions/${submission.id}/files/${field.name}`)} className="inline-flex items-center gap-1.5 text-[var(--admin-primary)] hover:underline">
                                                <Download className="h-4 w-4" /> {field.file.name} <span className="text-sm text-[var(--admin-muted)]">({formatSize(field.file.size)})</span>
                                            </a>
                                        ) : (
                                            <span className="text-[var(--admin-muted)]">Not uploaded</span>
                                        )
                                    ) : field.type === 'email' && field.value ? (
                                        <a href={`mailto:${field.value}`} className="text-[var(--admin-primary)] hover:underline">
                                            {field.value}
                                        </a>
                                    ) : (
                                        (field.value ?? <span className="text-[var(--admin-muted)]">—</span>)
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Card>
                <Card title="Review">
                    <form onSubmit={save} className="space-y-5">
                        <div>
                            <label htmlFor="status" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
                                Status
                            </label>
                            <select id="status" value={form.data.status} onChange={(event) => form.setData('status', event.target.value)} className={`${inputClass} capitalize`}>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1.5 text-xs text-[var(--admin-muted)]">{publishable ? 'Choosing “approved” publishes it on the website.' : 'Applicants see this status when they track their application.'}</p>
                        </div>
                        <div>
                            <label htmlFor="notes" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
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
                </Card>
            </div>
        </AdminLayout>
    );
}
