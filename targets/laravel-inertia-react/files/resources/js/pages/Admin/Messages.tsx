import { Link, router } from '@inertiajs/react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { AdminLayout, buttonClass } from '@/admin/AdminLayout';

type Message = { id: number; name: string; email: string; phone: string | null; subject: string; message: string; read_at: string | null; created_at: string };

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[]; total: number };

function pageLabel(label: string): string {
    return label.replace('&laquo;', '«').replace('&raquo;', '»');
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function Messages({ messages }: { messages: Paginated<Message> }) {
    const toggleRead = (message: Message) => router.patch(`/admin/messages/${message.id}`, {}, { preserveScroll: true });

    const destroy = (message: Message) => {
        if (window.confirm(`Delete the message from ${message.name}?`)) {
            router.delete(`/admin/messages/${message.id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title={`Messages (${messages.total})`}>
            {messages.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
                    <Mail className="mx-auto h-8 w-8 text-zinc-400" />
                    <p className="mt-3">No enquiries yet. Messages sent through the website’s contact form will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.data.map((message) => (
                        <article key={message.id} className={`rounded-xl border bg-white p-5 shadow-sm ${message.read_at ? 'border-zinc-200' : 'border-blue-200 ring-1 ring-blue-100'}`}>
                            <header className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold">
                                        {!message.read_at && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600 align-middle" aria-label="Unread" />}
                                        {message.name} <span className="font-normal text-zinc-500">· {message.subject}</span>
                                    </p>
                                    <p className="mt-0.5 text-sm text-zinc-500">
                                        <a href={`mailto:${message.email}`} className="hover:underline">
                                            {message.email}
                                        </a>
                                        {message.phone && (
                                            <>
                                                {' · '}
                                                <a href={`tel:${message.phone}`} className="hover:underline">
                                                    {message.phone}
                                                </a>
                                            </>
                                        )}
                                        {' · '}
                                        {formatDate(message.created_at)}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => toggleRead(message)} className={buttonClass.secondary}>
                                        {message.read_at ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                                        {message.read_at ? 'Mark unread' : 'Mark read'}
                                    </button>
                                    <button type="button" onClick={() => destroy(message)} aria-label="Delete message" className={buttonClass.danger}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </header>
                            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700">{message.message}</p>
                        </article>
                    ))}
                </div>
            )}
            {messages.links.length > 3 && (
                <nav aria-label="Pagination" className="mt-8 flex flex-wrap justify-center gap-1">
                    {messages.links.map((link, index) =>
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                preserveScroll
                                className={`rounded-lg px-3 py-1.5 text-sm ${link.active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                            >
                                {pageLabel(link.label)}
                            </Link>
                        ) : (
                            <span key={index} className="px-3 py-1.5 text-sm text-zinc-300">
                                {pageLabel(link.label)}
                            </span>
                        ),
                    )}
                </nav>
            )}
        </AdminLayout>
    );
}
