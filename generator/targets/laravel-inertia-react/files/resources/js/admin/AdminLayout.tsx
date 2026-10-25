import { Head, Link, router, usePage } from '@inertiajs/react';
import { BellRing, CircleCheck, ExternalLink, Globe, Inbox, LayoutDashboard, LogOut, Mail, Menu, UserCog, Users, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { SharedProps } from './types';
import { useAdminUrl, useSiteUrl } from './urls';

export function AdminLayout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
    const { auth, flash, schoolName } = usePage<SharedProps>().props;
    const url = usePage().url;
    const admin = useAdminUrl();
    const siteUrl = useSiteUrl();
    const [notice, setNotice] = useState<string | null>(flash.success ?? null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setNotice(flash.success ?? null);

        if (!flash.success) {
            return;
        }

        const timer = window.setTimeout(() => setNotice(null), 4000);

        return () => window.clearTimeout(timer);
    }, [flash.success]);

    useEffect(() => setMenuOpen(false), [url]);

    const itemClass = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition';

    const navItem = (href: string, label: string, icon: ReactNode) => {
        const active = href === admin() ? url === href : url.startsWith(href);

        return (
            <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`${itemClass} ${active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
                {icon}
                {label}
            </Link>
        );
    };

    const brand = (
        <Link href={admin()} className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm text-white">{schoolName.slice(0, 1)}</span>
            <span className="truncate">{schoolName}</span>
        </Link>
    );

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased lg:flex">
            <Head title={`${title} · Admin`} />
            <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:hidden">
                {brand}
                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-expanded={menuOpen}
                    aria-controls="admin-menu"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                    {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Menu
                </button>
            </header>
            {menuOpen && <div className="fixed inset-0 z-40 bg-zinc-900/30 lg:hidden" onClick={() => setMenuOpen(false)} />}
            <aside
                id="admin-menu"
                className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-zinc-200 bg-white lg:sticky lg:top-[var(--admin-top,0px)] lg:z-auto lg:flex lg:h-[calc(100vh_-_var(--admin-top,0px))] lg:shrink-0`}
            >
                <div className="flex items-center justify-between gap-2 px-5 py-4">
                    {brand}
                    <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 lg:hidden">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
                    {navItem(admin(), 'Content', <LayoutDashboard className="h-4 w-4" />)}
                    {navItem(admin('/website'), 'Website', <Globe className="h-4 w-4" />)}
                    {navItem(admin('/messages'), 'Messages', <Mail className="h-4 w-4" />)}
                    {navItem(admin('/submissions'), 'Applications', <Inbox className="h-4 w-4" />)}
                    {auth.user?.isAdmin && (
                        <>
                            {navItem(admin('/alerts'), 'Alerts', <BellRing className="h-4 w-4" />)}
                            {navItem(admin('/staff'), 'Staff', <Users className="h-4 w-4" />)}
                        </>
                    )}
                    {navItem(admin('/account'), 'Account', <UserCog className="h-4 w-4" />)}
                </nav>
                <div className="flex flex-col gap-1 border-t border-zinc-200 px-3 py-3">
                    <a href={siteUrl} target="_blank" rel="noreferrer" className={`${itemClass} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900`}>
                        <ExternalLink className="h-4 w-4" /> View site
                    </a>
                    <button type="button" onClick={() => router.post(admin('/logout'))} className={`${itemClass} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900`}>
                        <LogOut className="h-4 w-4" /> Sign out
                    </button>
                    {auth.user && <p className="truncate px-3 pt-1 text-xs text-zinc-500">Signed in as {auth.user.email}</p>}
                </div>
            </aside>
            <main className="min-w-0 flex-1">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                    </div>
                    {children}
                </div>
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
