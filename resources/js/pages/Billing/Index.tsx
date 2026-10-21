import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ExternalLink, FileText, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError, PageHeading, StudioLayout } from '@/studio/StudioLayout';
import type { StudioSharedProps } from '@/studio/types';

type Plan = { id: number; name: string; price: number; period: 'month' | 'year'; description: string | null; projects_count: number };

type BillingStatus = 'none' | 'active' | 'due' | 'overdue' | 'suspended';

type School = { slug: string; name: string; planId: number | null; paidUntil: string | null; billingEmail: string | null; defaultEmail: string | null; status: BillingStatus; hosted: boolean; url: string | null };

type Invoice = { id: number; number: string; school: string; description: string; amount: number; periodStart: string; periodEnd: string; dueOn: string; status: 'unpaid' | 'paid' | 'void'; paidAt: string | null; paymentReference: string | null };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; last_page: number };

const statusStyle: Record<BillingStatus, { label: string; className: string }> = {
    none: { label: 'No plan', className: 'bg-zinc-100 text-zinc-600' },
    active: { label: 'Paid up', className: 'bg-emerald-50 text-emerald-700' },
    due: { label: 'Invoice due', className: 'bg-blue-50 text-blue-700' },
    overdue: { label: 'Overdue', className: 'bg-amber-50 text-amber-800' },
    suspended: { label: 'Suspended', className: 'bg-red-50 text-red-700' },
};

const invoiceStyle: Record<Invoice['status'], string> = { unpaid: 'bg-amber-50 text-amber-800', paid: 'bg-emerald-50 text-emerald-700', void: 'bg-zinc-100 text-zinc-500 line-through' };

function rupees(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function PlanRow({ plan }: { plan: Plan }) {
    const form = useForm({ name: plan.name, price: plan.price, period: plan.period, description: plan.description ?? '' });

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.put(`/billing/plans/${plan.id}`, { preserveScroll: true });
    };

    const remove = () => {
        if (window.confirm(`Delete the ${plan.name} plan?`)) {
            router.delete(`/billing/plans/${plan.id}`, { preserveScroll: true });
        }
    };

    return (
        <form onSubmit={save} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-start">
            <div>
                <input aria-label="Plan name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className={inputClass} />
                <input aria-label="Description" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} placeholder="What it includes" className={`${inputClass} mt-2 text-xs`} />
                <FieldError message={form.errors.name} />
                <p className="mt-1 text-xs text-zinc-500">{plan.projects_count === 1 ? '1 school' : `${plan.projects_count} schools`}</p>
            </div>
            <div>
                <input aria-label="Price in rupees" type="number" min={0} value={form.data.price} onChange={(event) => form.setData('price', Number(event.target.value))} className={inputClass} />
                <FieldError message={form.errors.price} />
            </div>
            <select aria-label="Billing period" value={form.data.period} onChange={(event) => form.setData('period', event.target.value as Plan['period'])} className={inputClass}>
                <option value="month">per month</option>
                <option value="year">per year</option>
            </select>
            <div className="flex gap-1">
                <button type="submit" disabled={!form.isDirty || form.processing} className={buttonClass.secondary}>
                    Save
                </button>
                <button type="button" onClick={remove} className={buttonClass.danger} aria-label={`Delete ${plan.name}`}>
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </form>
    );
}

function SchoolRow({ school, plans }: { school: School; plans: Plan[] }) {
    const form = useForm({ plan_id: school.planId ? String(school.planId) : '', paid_until: school.paidUntil ?? '', billing_email: school.billingEmail ?? '' });
    const errors = form.errors as Record<string, string | undefined>;

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ plan_id: data.plan_id ? Number(data.plan_id) : null, paid_until: data.paid_until || null, billing_email: data.billing_email || null }));
        form.put(`/billing/schools/${school.slug}`, { preserveScroll: true });
    };

    return (
        <tr className="align-top">
            <td className="px-5 py-4">
                <p className="font-medium">{school.name}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[school.status].className}`}>{statusStyle[school.status].label}</span>
                {school.url && (
                    <a href={school.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
                        Hosted <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </td>
            <td className="px-5 py-4" colSpan={4}>
                <form onSubmit={save} className="grid gap-2 lg:grid-cols-[10rem_10rem_minmax(0,1fr)_auto]">
                    <select aria-label={`Plan for ${school.name}`} value={form.data.plan_id} onChange={(event) => form.setData('plan_id', event.target.value)} className={inputClass}>
                        <option value="">No plan</option>
                        {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} ({rupees(plan.price)}/{plan.period})
                            </option>
                        ))}
                    </select>
                    <div>
                        <input type="date" aria-label={`Paid until for ${school.name}`} value={form.data.paid_until} onChange={(event) => form.setData('paid_until', event.target.value)} className={inputClass} />
                        <FieldError message={errors.paid_until} />
                    </div>
                    <div>
                        <input type="email" aria-label={`Billing email for ${school.name}`} value={form.data.billing_email} onChange={(event) => form.setData('billing_email', event.target.value)} placeholder={school.defaultEmail ?? 'billing@school.edu.np'} className={inputClass} />
                        <FieldError message={errors.billing_email} />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={!form.isDirty || form.processing} className={buttonClass.secondary}>
                            Save
                        </button>
                        {school.planId && (
                            <button type="button" onClick={() => router.post(`/billing/schools/${school.slug}/invoices`, {}, { preserveScroll: true })} className={`${buttonClass.secondary} whitespace-nowrap`}>
                                <FileText className="h-4 w-4" /> Invoice now
                            </button>
                        )}
                    </div>
                </form>
            </td>
        </tr>
    );
}

export default function BillingIndex({ plans, schools, invoices, graceDays }: { plans: Plan[]; schools: School[]; invoices: Paginated<Invoice>; graceDays: number }) {
    const { errors } = usePage<StudioSharedProps>().props;
    const newPlan = useForm({ name: '', price: 1500, period: 'month', description: '' });
    const [paying, setPaying] = useState<Invoice | null>(null);
    const [reference, setReference] = useState('');

    const addPlan = (event: FormEvent) => {
        event.preventDefault();
        newPlan.post('/billing/plans', { preserveScroll: true, onSuccess: () => newPlan.reset() });
    };

    const pay = (event: FormEvent) => {
        event.preventDefault();
        router.post(`/invoices/${paying!.id}/pay`, { payment_reference: reference }, { preserveScroll: true, onSuccess: () => (setPaying(null), setReference('')) });
    };

    return (
        <StudioLayout title="Billing">
            <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
                <PageHeading
                    title="Billing"
                    description={`Schools on a plan get an invoice by email before their paid period ends. A hosted school more than ${graceDays} days late shows a “temporarily unavailable” page until you mark its invoice paid.`}
                />

                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Plans</h2>
                    <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm">
                        {plans.map((plan) => (
                            <PlanRow key={`${plan.id}-${plan.price}-${plan.name}`} plan={plan} />
                        ))}
                        <form onSubmit={addPlan} className="grid gap-3 bg-zinc-50/60 px-5 py-4 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-start">
                            <div>
                                <input aria-label="New plan name" value={newPlan.data.name} onChange={(event) => newPlan.setData('name', event.target.value)} placeholder="New plan, e.g. Standard" className={inputClass} />
                                <FieldError message={newPlan.errors.name} />
                            </div>
                            <input aria-label="New plan price in rupees" type="number" min={0} value={newPlan.data.price} onChange={(event) => newPlan.setData('price', Number(event.target.value))} className={inputClass} />
                            <select aria-label="New plan billing period" value={newPlan.data.period} onChange={(event) => newPlan.setData('period', event.target.value)} className={inputClass}>
                                <option value="month">per month</option>
                                <option value="year">per year</option>
                            </select>
                            <button type="submit" disabled={newPlan.processing} className={buttonClass.primary}>
                                <Plus className="h-4 w-4" /> Add plan
                            </button>
                        </form>
                    </div>
                    <FieldError message={(errors as Record<string, string | undefined>).plan} />
                </section>

                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Schools</h2>
                    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                        <table className="w-full min-w-[48rem] text-sm">
                            <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                                <tr>
                                    <th className="px-5 py-3 font-medium">School</th>
                                    <th className="px-5 py-3 font-medium" colSpan={4}>
                                        Plan · paid until · invoice email
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {schools.map((school) => (
                                    <SchoolRow key={`${school.slug}-${school.planId}-${school.paidUntil}-${school.billingEmail}`} school={school} plans={plans} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Invoices</h2>
                    {invoices.data.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">No invoices yet. They are issued automatically (php artisan studio:invoices runs daily) or with Invoice now.</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <table className="w-full min-w-[48rem] text-sm">
                                <thead className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Invoice</th>
                                        <th className="px-5 py-3 font-medium">School</th>
                                        <th className="px-5 py-3 font-medium">Period</th>
                                        <th className="px-5 py-3 font-medium">Due</th>
                                        <th className="px-5 py-3 text-right font-medium">Amount</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {invoices.data.map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="px-5 py-3 font-mono text-xs">
                                                <a href={`/invoices/${invoice.id}`} target="_blank" rel="noreferrer" className="hover:underline">
                                                    {invoice.number}
                                                </a>
                                            </td>
                                            <td className="px-5 py-3">{invoice.school}</td>
                                            <td className="px-5 py-3 text-zinc-600">
                                                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                                            </td>
                                            <td className="px-5 py-3 text-zinc-600">{formatDate(invoice.dueOn)}</td>
                                            <td className="px-5 py-3 text-right tabular-nums">{rupees(invoice.amount)}</td>
                                            <td className="px-5 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${invoiceStyle[invoice.status]}`}>{invoice.status}</span>
                                                {invoice.paymentReference && <p className="mt-1 text-xs text-zinc-500">{invoice.paymentReference}</p>}
                                            </td>
                                            <td className="px-5 py-3 text-right whitespace-nowrap">
                                                {invoice.status === 'unpaid' && (
                                                    <>
                                                        <button type="button" onClick={() => setPaying(invoice)} className="rounded px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                                            Mark paid
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => window.confirm(`Cancel ${invoice.number}?`) && router.post(`/invoices/${invoice.id}/void`, {}, { preserveScroll: true })}
                                                            className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {invoices.last_page > 1 && (
                                <nav className="flex flex-wrap gap-1 border-t border-zinc-100 px-5 py-3" aria-label="Pages">
                                    {invoices.links.map((link) =>
                                        link.url ? <Link key={link.label} href={link.url} preserveScroll className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : null,
                                    )}
                                </nav>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {paying && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="pay-title">
                    <form onSubmit={pay} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
                        <h2 id="pay-title" className="font-semibold">
                            Mark {paying.number} paid
                        </h2>
                        <p className="text-sm text-zinc-600">
                            {rupees(paying.amount)} from {paying.school}. Its paid period extends to {formatDate(paying.periodEnd)}.
                        </p>
                        <div>
                            <label htmlFor="reference" className="mb-1.5 block text-sm font-medium">
                                Payment reference (optional)
                            </label>
                            <input id="reference" autoFocus value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. eSewa transaction or cheque number" className={inputClass} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setPaying(null)} className={buttonClass.secondary}>
                                Cancel
                            </button>
                            <button type="submit" className={buttonClass.primary}>
                                Mark paid
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </StudioLayout>
    );
}
