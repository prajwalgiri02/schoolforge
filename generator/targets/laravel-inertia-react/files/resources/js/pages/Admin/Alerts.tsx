import { useForm } from '@inertiajs/react';
import { Download, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';

type Alert = { id: number; subject: string; message: string; email_count: number; error: string | null; sent_at: string | null; created_at: string; sender: { name: string } | null };

type Props = { subscriberCount: number; alerts: Alert[] };

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function Alerts({ subscriberCount, alerts }: Props) {
    const form = useForm({ subject: '', message: '' });

    const send = (event: FormEvent) => {
        event.preventDefault();
        if (window.confirm(`Email “${form.data.subject}” to ${subscriberCount} ${subscriberCount === 1 ? 'subscriber' : 'subscribers'}?`)) {
            form.post('/admin/alerts', { preserveScroll: true, onSuccess: () => form.reset() });
        }
    };

    return (
        <AdminLayout title="Alerts">
            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                <form onSubmit={send} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div>
                        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">
                            Subject
                        </label>
                        <input id="subject" value={form.data.subject} onChange={(event) => form.setData('subject', event.target.value)} placeholder="e.g. School closed tomorrow due to heavy rain" className={inputClass} />
                        {form.errors.subject && <p className="mt-1 text-sm text-red-600">{form.errors.subject}</p>}
                    </div>
                    <div>
                        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                            Message
                        </label>
                        <textarea id="message" rows={6} value={form.data.message} onChange={(event) => form.setData('message', event.target.value)} className={inputClass} />
                        {form.errors.message && <p className="mt-1 text-sm text-red-600">{form.errors.message}</p>}
                    </div>
                    <button type="submit" disabled={form.processing || subscriberCount === 0} className={buttonClass.primary}>
                        <Send className="h-4 w-4" /> Email subscribers
                    </button>
                </form>
                <aside className="space-y-4">
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-zinc-500">Subscribers</p>
                        <p className="mt-1 text-2xl font-semibold">
                            {subscriberCount}
                        </p>
                        <a href="/admin/alerts/subscribers.csv" className={`${buttonClass.secondary} mt-4 w-full`}>
                            <Download className="h-4 w-4" /> Export CSV
                        </a>
                    </div>
                </aside>
            </div>
            <h2 className="mb-3 mt-10 text-lg font-semibold">Sent alerts</h2>
            {alerts.length === 0 ? (
                <p className="text-sm text-zinc-500">No alerts sent yet.</p>
            ) : (
                <ul className="space-y-3">
                    {alerts.map((alert) => (
                        <li key={alert.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="font-semibold">{alert.subject}</p>
                                <p className="text-xs text-zinc-500">
                                    {alert.sent_at ? `Sent ${formatDate(alert.sent_at)}` : 'Sending…'} · {alert.email_count} emails{alert.sender && ` · by ${alert.sender.name}`}
                                </p>
                            </div>
                            <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-zinc-600">{alert.message}</p>
                            {alert.error && <p className="mt-2 text-sm text-red-600">{alert.error}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </AdminLayout>
    );
}
