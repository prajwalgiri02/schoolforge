import { router, useForm } from '@inertiajs/react';
import { Download, Mail, MailOpen, Reply, Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';
import { Avatar, Badge, Card, EmptyState, Pagination } from '@/admin/ui';
import { useAdminUrl } from '@/admin/urls';

type Message = { id: number; name: string; email: string; phone: string | null; subject: string; campus: string | null; message: string; reply: string | null; replied_at: string | null; read_at: string | null; created_at: string };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; total: number };

type Filter = 'all' | 'new' | 'replied';

const formatDate = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

const formatDateTime = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

function status(message: Message) {
    if (message.replied_at) {
        return <Badge tone="green">Replied</Badge>;
    }

    return message.read_at ? <Badge tone="primary">Read</Badge> : <Badge tone="orange">New</Badge>;
}

function ReplyBox({ message }: { message: Message }) {
    const admin = useAdminUrl();
    const [open, setOpen] = useState(false);
    const form = useForm({ reply: '' });

    if (message.replied_at) {
        return (
            <div className="rounded-[12px] border-l-4 border-[#31b057] bg-[#effaf3] px-4 py-3 text-sm">
                <p className="font-medium text-[#1f8a45]">You replied {formatDateTime(message.replied_at)}</p>
                <p className="mt-1 whitespace-pre-line text-[var(--admin-text)]">{message.reply}</p>
            </div>
        );
    }

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} className={`${buttonClass.primary} h-12 px-6 text-base`}>
                <Reply className="h-5 w-5" /> Reply by email
            </button>
        );
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.post(admin(`/messages/${message.id}/reply`), { preserveScroll: true, onSuccess: () => setOpen(false) });
            }}
            className="space-y-3"
        >
            <textarea aria-label={`Reply to ${message.name}`} autoFocus rows={6} value={form.data.reply} onChange={(event) => form.setData('reply', event.target.value)} placeholder={`Dear ${message.name},`} className={inputClass} />
            {form.errors.reply && <p className="text-sm text-red-600">{form.errors.reply}</p>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={form.processing} className={buttonClass.primary}>
                    <Send className="h-4 w-4" /> Send to {message.email}
                </button>
                <button type="button" onClick={() => setOpen(false)} className={buttonClass.secondary}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function Messages({ messages }: { messages: Paginated<Message> }) {
    const admin = useAdminUrl();
    const [filter, setFilter] = useState<Filter>('all');
    const [selectedId, setSelectedId] = useState<number | null>(messages.data[0]?.id ?? null);
    const detail = useRef<HTMLDivElement>(null);
    const visible = messages.data.filter((message) => (filter === 'new' ? !message.read_at : filter === 'replied' ? Boolean(message.replied_at) : true));
    const selected = messages.data.find((message) => message.id === selectedId) ?? visible[0] ?? null;

    useEffect(() => {
        if (selectedId !== null && !messages.data.some((message) => message.id === selectedId)) {
            setSelectedId(messages.data[0]?.id ?? null);
        }
    }, [messages.data, selectedId]);

    const open = (message: Message) => {
        setSelectedId(message.id);

        if (window.matchMedia('(max-width: 1279px)').matches) {
            detail.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const toggleRead = (message: Message) => router.patch(admin(`/messages/${message.id}`), {}, { preserveScroll: true });

    const destroy = (message: Message) => {
        if (window.confirm(`Delete the message from ${message.name}?`)) {
            router.delete(admin(`/messages/${message.id}`), { preserveScroll: true });
        }
    };

    const filters: { value: Filter; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'new', label: 'New' },
        { value: 'replied', label: 'Replied' },
    ];

    return (
        <AdminLayout
            title={`Messages (${messages.total})`}
            description="Enquiries sent from the website’s contact form."
            actions={
                messages.total > 0 && (
                    <a href={admin('/messages/export.csv')} className={buttonClass.secondary}>
                        <Download className="h-4 w-4" /> Export CSV
                    </a>
                )
            }
        >
            {messages.data.length === 0 ? (
                <Card>
                    <EmptyState icon={Mail} title="No enquiries yet">
                        Messages sent through the website’s contact form will appear here.
                    </EmptyState>
                </Card>
            ) : (
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <Card
                        title="Inbox"
                        padded={false}
                        actions={
                            <div className="inline-flex rounded-[12px] bg-[#eef0f3] p-1">
                                {filters.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setFilter(item.value)}
                                        aria-pressed={filter === item.value}
                                        className={`min-h-9 rounded-[10px] px-4 text-xs font-medium transition ${filter === item.value ? 'bg-[var(--admin-primary)] text-[var(--admin-on-primary)]' : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        {visible.length === 0 ? (
                            <p className="px-6 pb-8 pt-2 text-sm text-[var(--admin-muted)]">No messages here on this page.</p>
                        ) : (
                            <ul className="pb-3">
                                {visible.map((message) => (
                                    <li key={message.id}>
                                        <button
                                            type="button"
                                            onClick={() => open(message)}
                                            aria-current={selected?.id === message.id ? 'true' : undefined}
                                            className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition sm:px-6 ${selected?.id === message.id ? 'bg-[var(--admin-primary-soft)]' : 'hover:bg-[var(--admin-hover)]'}`}
                                        >
                                            <Avatar name={message.name} />
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate ${message.read_at ? 'text-[var(--admin-text)]' : 'font-semibold text-[var(--admin-heading)]'}`}>{message.name}</span>
                                                <span className="block truncate text-xs text-[var(--admin-muted)]">{message.subject}</span>
                                            </span>
                                            {status(message)}
                                            <span className="hidden w-24 shrink-0 text-right text-[var(--admin-muted)] sm:block">{formatDate(message.created_at)}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                    <div ref={detail} className="scroll-mt-24">
                        {selected && (
                            <Card padded={false}>
                                <header className="flex flex-wrap items-center gap-3 border-b border-[var(--admin-border)] px-5 py-4 sm:px-6">
                                    <Avatar name={selected.name} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-base font-medium text-[var(--admin-heading)]">{selected.name}</p>
                                        <a href={`mailto:${selected.email}`} className="block truncate text-xs text-[var(--admin-muted)] hover:underline">
                                            {selected.email}
                                        </a>
                                    </div>
                                    {selected.campus && <Badge tone="primary">{selected.campus}</Badge>}
                                    {status(selected)}
                                    <button type="button" onClick={() => toggleRead(selected)} title={selected.read_at ? 'Mark unread' : 'Mark read'} aria-label={selected.read_at ? 'Mark unread' : 'Mark read'} className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[var(--admin-muted)] hover:bg-[#eef0f3]">
                                        {selected.read_at ? <Mail className="h-[18px] w-[18px]" /> : <MailOpen className="h-[18px] w-[18px]" />}
                                    </button>
                                    <button type="button" onClick={() => destroy(selected)} title="Delete message" aria-label="Delete message" className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#e11d38] hover:bg-[#fde7eb]">
                                        <Trash2 className="h-[18px] w-[18px]" />
                                    </button>
                                </header>
                                <div className="space-y-5 px-5 py-5 sm:px-6">
                                    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                                        <div className="border-b border-[var(--admin-border)] pb-3">
                                            <dt className="text-sm text-[var(--admin-muted)]">Received</dt>
                                            <dd className="mt-1 text-base text-[var(--admin-heading)]">{formatDateTime(selected.created_at)}</dd>
                                        </div>
                                        <div className="border-b border-[var(--admin-border)] pb-3 pt-3 sm:pt-0">
                                            <dt className="text-sm text-[var(--admin-muted)]">Phone</dt>
                                            <dd className="mt-1 text-base text-[var(--admin-heading)]">
                                                {selected.phone ? (
                                                    <a href={`tel:${selected.phone}`} className="hover:underline">
                                                        {selected.phone}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="border-b border-[var(--admin-border)] pb-5">
                                        <p className="text-sm text-[var(--admin-muted)]">Message</p>
                                        <p className="mt-1 font-semibold text-[var(--admin-heading)]">{selected.subject}</p>
                                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--admin-text)]">{selected.message}</p>
                                    </div>
                                    <ReplyBox key={selected.id} message={selected} />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}
            <Pagination links={messages.links} />
        </AdminLayout>
    );
}
