import { Head, Link, router, usePage } from '@inertiajs/react';
import { BellRing, CircleCheck, ExternalLink, GraduationCap, Inbox, LayoutDashboard, LogOut, Mail, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { SharedProps } from './types';

export function AdminLayout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
    const { auth, flash, schoolName } = usePage<SharedProps>().props;
    const url = usePage().url;
    const [notice, setNotice] = useState<string | null>(flash.success ?? null);

    useEffect(() => {
        setNotice(flash.success ?? null);

        if (!flash.success) {
            return;
        }

        const timer = window.setTimeout(() => setNotice(null), 4000);

        return () => window.clearTimeout(timer);
    }, [flash.success]);

    const navItem = (href: string, label: string, icon: ReactNode) => {
        const active = href === '/admin' ? url === '/admin' : url.startsWith(href);

        return (
            <Link
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
                {icon}
                {label}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
            <Head title={`${title} · Admin`} />
            <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <Link href="/admin" className="flex items-center gap-2 font-semibold">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm text-white">{schoolName.slice(0, 1)}</span>
                        <span className="hidden sm:inline">{schoolName} admin</span>
                    </Link>
                    <nav className="flex items-center gap-1">
                        {navItem('/admin', 'Content', <LayoutDashboard className="h-4 w-4" />)}
                        {navItem('/admin/messages', 'Messages', <Mail className="h-4 w-4" />)}
                        {navItem('/admin/submissions', 'Applications', <Inbox className="h-4 w-4" />)}
                        {navItem('/admin/results', 'Results', <GraduationCap className="h-4 w-4" />)}
                        {navItem('/admin/alerts', 'Alerts', <BellRing className="h-4 w-4" />)}
                        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100">
                            <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View site</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => router.post('/admin/logout')}
                            title={auth.user ? `Signed in as ${auth.user.email}` : undefined}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                        >
                            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                </div>
                {children}
            </main>
            {notice && (
                <div role="status" className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{notice}</span>
                    <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-zinc-400 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

export const inputClass =
    'block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10';

export const buttonClass = {
    primary: 'inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:opacity-50',
    secondary: 'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50',
    danger: 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50',
};
