import { Link, router } from '@inertiajs/react';
import { Download, Wallet } from 'lucide-react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';

type Payment = { id: number; reference: string; gateway: string; status: string; amount: string; purpose: string; student_name: string; class: string | null; payer_name: string; email: string | null; gateway_reference: string | null; paid_at: string | null; created_at: string };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; total: number };

const money = (value: number | string) => `NPR ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusClass: Record<string, string> = { paid: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700', failed: 'bg-red-50 text-red-700' };

export default function Payments({ status, gateways, totals, payments }: { status: string; gateways: { id: string; label: string }[]; totals: { month: number; all: number }; payments: Paginated<Payment> }) {
    return (
        <AdminLayout title="Payments">
            {gateways.length === 0 && (
                <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Online payments are off. Add ESEWA_PRODUCT_CODE and ESEWA_SECRET_KEY and/or KHALTI_SECRET_KEY to the server's .env file to show them on the Pay Fees page.
                </p>
            )}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-zinc-500">Received this month</p>
                    <p className="mt-1 text-2xl font-semibold">{money(totals.month)}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-zinc-500">Received in total</p>
                    <p className="mt-1 text-2xl font-semibold">{money(totals.all)}</p>
                </div>
                <div className="flex flex-col justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <select aria-label="Show" value={status} onChange={(event) => router.get('/admin/payments', { status: event.target.value }, { preserveState: true })} className={inputClass}>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="all">All</option>
                    </select>
                    <a href="/admin/payments/export.csv" className={buttonClass.secondary}>
                        <Download className="h-4 w-4" /> Export paid (CSV)
                    </a>
                </div>
            </div>
            {payments.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
                    <Wallet className="mx-auto h-8 w-8 text-zinc-400" />
                    <p className="mt-3">No payments here yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Receipt</th>
                                <th className="px-4 py-3 font-semibold">Student</th>
                                <th className="px-4 py-3 font-semibold">For</th>
                                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                                <th className="px-4 py-3 font-semibold">Method</th>
                                <th className="px-4 py-3 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {payments.data.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-4 py-3">
                                        <p className="font-mono text-xs font-semibold">{payment.reference}</p>
                                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass[payment.status] ?? ''}`}>{payment.status}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{payment.student_name}</p>
                                        <p className="text-xs text-zinc-500">{[payment.class, payment.payer_name].filter(Boolean).join(' · ')}</p>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-600">{payment.purpose}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{money(payment.amount)}</td>
                                    <td className="px-4 py-3">
                                        {payment.gateway === 'esewa' ? 'eSewa' : 'Khalti'}
                                        {payment.gateway_reference && <p className="font-mono text-xs text-zinc-500">{payment.gateway_reference}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-500">{new Date(payment.paid_at ?? payment.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {payments.links.length > 3 && (
                <nav aria-label="Pagination" className="mt-8 flex flex-wrap justify-center gap-1">
                    {payments.links.map((link, index) =>
                        link.url ? (
                            <Link key={index} href={link.url} className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
                                {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                            </Link>
                        ) : (
                            <span key={index} className="px-3 py-1.5 text-sm text-zinc-300">
                                {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                            </span>
                        ),
                    )}
                </nav>
            )}
        </AdminLayout>
    );
}
