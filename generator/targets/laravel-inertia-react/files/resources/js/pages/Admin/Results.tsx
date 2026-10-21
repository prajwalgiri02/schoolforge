import { router, useForm } from '@inertiajs/react';
import { Download, Eye, EyeOff, GraduationCap, Trash2, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';

type Exam = { id: number; name: string; published_at: string | null; results_count: number; created_at: string };

export default function Results({ exams }: { exams: Exam[] }) {
    const form = useForm<{ exam_id: string; name: string; file: File | null }>({ exam_id: '', name: '', file: null });

    const upload = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/results', { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset() });
    };

    const togglePublished = (exam: Exam) => router.patch(`/admin/results/${exam.id}`, {}, { preserveScroll: true });

    const destroy = (exam: Exam) => {
        if (window.confirm(`Delete ${exam.name} and all ${exam.results_count} results?`)) {
            router.delete(`/admin/results/${exam.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="Exam results">
            <form onSubmit={upload} className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold">Import results</h2>
                <p className="mt-1 text-sm text-zinc-500">
                    Save your marks spreadsheet as CSV. The first row needs <code>symbol_number</code> and <code>student_name</code>; <code>date_of_birth</code>, <code>class</code>, <code>gpa</code> and <code>result</code> are optional and every other column is a subject.{' '}
                    <a href="/admin/results/template.csv" className="inline-flex items-center gap-1 font-medium text-zinc-900 underline">
                        <Download className="h-3.5 w-3.5" /> Download a template
                    </a>
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="exam" className="mb-1.5 block text-sm font-medium">
                            Exam
                        </label>
                        <select id="exam" value={form.data.exam_id} onChange={(event) => form.setData('exam_id', event.target.value)} className={inputClass}>
                            <option value="">New exam…</option>
                            {exams.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                    Replace results of {exam.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {form.data.exam_id === '' && (
                        <div>
                            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                                Exam name
                            </label>
                            <input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="e.g. Annual Examination 2082" className={inputClass} />
                            {form.errors.name && <p className="mt-1 text-sm text-red-600">{form.errors.name}</p>}
                        </div>
                    )}
                    <div>
                        <label htmlFor="file" className="mb-1.5 block text-sm font-medium">
                            CSV file
                        </label>
                        <input id="file" type="file" accept=".csv,text/csv" onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)} className={inputClass} />
                        {form.errors.file && <p className="mt-1 text-sm text-red-600">{form.errors.file}</p>}
                    </div>
                </div>
                <button type="submit" disabled={form.processing || !form.data.file} className={`${buttonClass.primary} mt-5`}>
                    <Upload className="h-4 w-4" /> Import
                </button>
            </form>
            {exams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
                    <GraduationCap className="mx-auto h-8 w-8 text-zinc-400" />
                    <p className="mt-3">No exams yet. Import a CSV to let students look up their results on the website.</p>
                </div>
            ) : (
                <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    {exams.map((exam) => (
                        <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <div>
                                <p className="font-semibold">{exam.name}</p>
                                <p className="text-sm text-zinc-500">
                                    {exam.results_count} results · {exam.published_at ? <span className="font-medium text-green-700">Published</span> : 'Hidden'}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <button type="button" onClick={() => togglePublished(exam)} className={buttonClass.secondary}>
                                    {exam.published_at ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    {exam.published_at ? 'Hide' : 'Publish'}
                                </button>
                                <button type="button" onClick={() => destroy(exam)} aria-label={`Delete ${exam.name}`} className={buttonClass.danger}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </AdminLayout>
    );
}
