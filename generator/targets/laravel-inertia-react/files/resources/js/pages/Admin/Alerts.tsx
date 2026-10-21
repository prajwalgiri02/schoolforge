import { useForm } from '@inertiajs/react';
import { Download, Mail, MessageSquare, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';

type Alert = { id: number; subject: string; message: string; channels: string[]; email_count: number; sms_count: number; error: string | null; sent_at: string | null; created_at: string; sender: { name: string } | null };

type Props = { counts: { email: number; sms: number }; smsConfigured: boolean; alerts: Alert[] };

const SMS_LENGTH = 160;

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function Alerts({ counts, smsConfigured, alerts }: Props) {
    const form = useForm({ subject: '', message: '', channels: ['email'] as string[] });
    const toggle = (channel: string) => form.setData('channels', form.data.channels.includes(channel) ? form.data.channels.filter((item) => item !== channel) : [...form.data.channels, channel]);
    const smsParts = Math.max(1, Math.ceil(form.data.message.length / SMS_LENGTH));

    const send = (event: FormEvent) => {
        event.preventDefault();
        const recipients = form.data.channels.map((channel) => `${counts[channel as 'email' | 'sms']} by ${channel === 'sms' ? 'SMS' : 'email'}`).join(' and ');

        if (window.confirm(`Send “${form.data.subject}” to ${recipients}?`)) {
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
                        {form.data.channels.includes('sms') && (
                            <p className="mt-1 text-xs text-zinc-500">
                                {form.data.message.length} characters · {smsParts} SMS {smsParts === 1 ? 'credit' : 'credits'} per number (Nepali text uses more)
                            </p>
                        )}
                        {form.errors.message && <p className="mt-1 text-sm text-red-600">{form.errors.message}</p>}
                    </div>
                    <fieldset className="flex flex-wrap gap-6">
                        <legend className="mb-2 text-sm font-medium">Send by</legend>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={form.data.channels.includes('email')} onChange={() => toggle('email')} className="h-4 w-4 rounded border-zinc-300" />
                            <Mail className="h-4 w-4 text-zinc-500" /> Email ({counts.email})
                        </label>
                        <label className={`flex items-center gap-2 text-sm ${smsConfigured ? '' : 'text-zinc-400'}`}>
                            <input type="checkbox" disabled={!smsConfigured} checked={form.data.channels.includes('sms')} onChange={() => toggle('sms')} className="h-4 w-4 rounded border-zinc-300" />
                            <MessageSquare className="h-4 w-4" /> SMS ({counts.sms})
                        </label>
                    </fieldset>
                    {!smsConfigured && <p className="text-xs text-zinc-500">To send SMS, add your Sparrow SMS token as SPARROW_SMS_TOKEN in the server's .env file.</p>}
                    {(form.errors.channels || form.errors['channels.0']) && <p className="text-sm text-red-600">{form.errors.channels ?? form.errors['channels.0']}</p>}
                    <button type="submit" disabled={form.processing || form.data.channels.length === 0} className={buttonClass.primary}>
                        <Send className="h-4 w-4" /> Send alert
                    </button>
                </form>
                <aside className="space-y-4">
                    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-zinc-500">Subscribers</p>
                        <p className="mt-1 text-2xl font-semibold">
                            {counts.email} <span className="text-sm font-normal text-zinc-500">email</span> · {counts.sms} <span className="text-sm font-normal text-zinc-500">SMS</span>
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
                                    {alert.sent_at ? `Sent ${formatDate(alert.sent_at)}` : 'Sending…'} · {alert.email_count} emails · {alert.sms_count} SMS{alert.sender && ` · by ${alert.sender.name}`}
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
