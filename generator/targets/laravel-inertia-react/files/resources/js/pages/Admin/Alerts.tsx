import { useForm } from '@inertiajs/react';
import { Download, Megaphone, Send, Users } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';
import { Badge, Card, EmptyState, IconTile, table } from '@/admin/ui';
import { useAdminUrl } from '@/admin/urls';

type Alert = { id: number; subject: string; message: string; email_count: number; error: string | null; sent_at: string | null; created_at: string; sender: { name: string } | null };

type Props = { subscriberCount: number; alerts: Alert[] };

const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default function Alerts({ subscriberCount, alerts }: Props) {
    const admin = useAdminUrl();
    const form = useForm({ subject: '', message: '' });

    const send = (event: FormEvent) => {
        event.preventDefault();
        if (window.confirm(`Email “${form.data.subject}” to ${subscriberCount} ${subscriberCount === 1 ? 'subscriber' : 'subscribers'}?`)) {
            form.post(admin('/alerts'), { preserveScroll: true, onSuccess: () => form.reset() });
        }
    };

    return (
        <AdminLayout title="Email alerts" description="Send news and urgent notices to everyone who subscribed on the website.">
            <div className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
                    <Card title="New alert">
                        <form onSubmit={send} className="space-y-5">
                            <div>
                                <label htmlFor="subject" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
                                    Subject
                                </label>
                                <input id="subject" value={form.data.subject} onChange={(event) => form.setData('subject', event.target.value)} placeholder="e.g. School closed tomorrow due to heavy rain" className={inputClass} />
                                {form.errors.subject && <p className="mt-1 text-sm text-red-600">{form.errors.subject}</p>}
                            </div>
                            <div>
                                <label htmlFor="message" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
                                    Message
                                </label>
                                <textarea id="message" rows={6} value={form.data.message} onChange={(event) => form.setData('message', event.target.value)} className={inputClass} />
                                {form.errors.message && <p className="mt-1 text-sm text-red-600">{form.errors.message}</p>}
                            </div>
                            <button type="submit" disabled={form.processing || subscriberCount === 0} className={buttonClass.primary}>
                                <Send className="h-4 w-4" /> Email subscribers
                            </button>
                        </form>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <IconTile icon={Users} tone="purple" />
                            <span className="leading-tight">
                                <span className="block text-sm font-light text-[#111827]">Subscribers</span>
                                <span className="mt-1 block text-2xl font-semibold tabular-nums text-[#111827]">{subscriberCount.toLocaleString('en-IN')}</span>
                            </span>
                        </div>
                        <a href={admin('/alerts/subscribers.csv')} className={`${buttonClass.secondary} mt-5 w-full`}>
                            <Download className="h-4 w-4" /> Export CSV
                        </a>
                    </Card>
                </div>
                <Card title="Sent alerts" padded={false}>
                    {alerts.length === 0 ? (
                        <EmptyState icon={Megaphone} title="No alerts sent yet">
                            Alerts you send appear here with how many people received them.
                        </EmptyState>
                    ) : (
                        <div className={`${table.wrap} pb-3`}>
                            <table className={table.table}>
                                <thead className={table.head}>
                                    <tr>
                                        <th className={table.th}>Subject</th>
                                        <th className={table.th}>Sent</th>
                                        <th className={table.th}>Emails</th>
                                        <th className={table.th}>By</th>
                                        <th className={table.th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alerts.map((alert) => (
                                        <tr key={alert.id} className={table.row}>
                                            <td className={table.td}>
                                                <span className="block font-medium text-[var(--admin-heading)]">{alert.subject}</span>
                                                <span className="line-clamp-1 max-w-md text-xs">{alert.error ?? alert.message}</span>
                                            </td>
                                            <td className={`${table.td} whitespace-nowrap`}>{alert.sent_at ? formatDate(alert.sent_at) : '—'}</td>
                                            <td className={`${table.td} tabular-nums`}>{alert.email_count}</td>
                                            <td className={table.td}>{alert.sender?.name ?? '—'}</td>
                                            <td className={table.td}>{alert.error ? <Badge tone="red">Failed</Badge> : alert.sent_at ? <Badge tone="green">Sent</Badge> : <Badge tone="orange">Sending</Badge>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
