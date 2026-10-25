import { Head, Link, router, usePage } from '@inertiajs/react';
import { BellRing, ChevronRight, CircleCheck, ExternalLink, FileText, Inbox, LayoutDashboard, LogOut, Mail, Menu, PanelsTopLeft, UserCog, Users, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { SharedProps } from './types';
import { useAdminUrl, useSiteUrl } from './urls';

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean };

export function AdminLayout({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
    const { auth, flash, inbox, schoolName } = usePage<SharedProps>().props;
    const url = usePage().url;
    const admin = useAdminUrl();
    const siteUrl = useSiteUrl();
    const [notice, setNotice] = useState<string | null>(flash.success ?? null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButton = useRef<HTMLButtonElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setNotice(flash.success ?? null);

        if (!flash.success) {
            return;
        }

        const timer = window.setTimeout(() => setNotice(null), 4000);

        return () => window.clearTimeout(timer);
    }, [flash.success]);

    useEffect(() => setMenuOpen(false), [url]);

    useEffect(() => {
        if (!menuOpen) {
            return;
        }

        closeButton.current?.focus();
        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            menuButton.current?.focus();
        };
    }, [menuOpen]);

    const groups: { title?: string; items: NavItem[] }[] = [
        { items: [{ href: admin(), label: 'Dashboard', icon: LayoutDashboard, exact: true }] },
        {
            title: 'Website',
            items: [
                { href: admin('/content'), label: 'Content', icon: FileText },
                { href: admin('/website'), label: 'Pages & design', icon: PanelsTopLeft },
            ],
        },
        {
            title: 'Inbox',
            items: [
                { href: admin('/messages'), label: 'Messages', icon: Mail, badge: inbox?.messages },
                { href: admin('/submissions'), label: 'Applications', icon: Inbox, badge: inbox?.submissions },
            ],
        },
        {
            title: 'Manage',
            items: [
                ...(auth.user?.isAdmin
                    ? [
                          { href: admin('/alerts'), label: 'Email alerts', icon: BellRing },
                          { href: admin('/staff'), label: 'Staff', icon: Users },
                      ]
                    : []),
                { href: admin('/account'), label: 'Your account', icon: UserCog },
            ],
        },
    ];

    const path = url.split('?')[0];
    const isActive = (item: NavItem) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));
    const current = groups.flatMap((group) => group.items).find(isActive);
    const crumbs = [current?.label, !current || path !== current.href ? title : null].filter((crumb): crumb is string => Boolean(crumb));
    const initials = (auth.user?.name ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased lg:flex">
            <Head title={`${title} · Admin`} />
            {menuOpen && <div className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden" onClick={() => setMenuOpen(false)} />}
            <aside
                id="admin-menu"
                className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex-col border-r border-zinc-200 bg-white lg:sticky lg:top-[var(--admin-top,0px)] lg:z-auto lg:flex lg:h-[calc(100vh_-_var(--admin-top,0px))] lg:w-64 lg:max-w-none lg:shrink-0`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-100 px-4">
                    <Link href={admin()} className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white">{schoolName.slice(0, 1)}</span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{schoolName}</span>
                            <span className="block text-xs text-zinc-500">Admin panel</span>
                        </span>
                    </Link>
                    <button ref={closeButton} type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                    {groups.map((group, index) => (
                        <div key={group.title ?? index}>
                            {group.title && <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{group.title}</p>}
                            <ul className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = isActive(item);
                                    const Icon = item.icon;

                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                aria-current={active ? 'page' : undefined}
                                                className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition lg:min-h-9 ${active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
                                            >
                                                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                                                <span className="truncate">{item.label}</span>
                                                {item.badge ? <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-blue-700">{item.badge}</span> : null}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
                <div className="shrink-0 border-t border-zinc-100 p-3">
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">{initials || '?'}</span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{auth.user?.name}</p>
                            <p className="truncate text-xs text-zinc-500" title={auth.user?.email}>
                                {auth.user?.email}
                            </p>
                        </div>
                        <button type="button" onClick={() => router.post(admin('/logout'))} title="Sign out" aria-label="Sign out" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 lg:h-9 lg:w-9">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col" inert={menuOpen}>
                <header className="sticky top-0 z-30 h-16 shrink-0 border-b border-zinc-200 bg-white/90 backdrop-blur lg:top-[var(--admin-top,0px)]">
                    <div className="mx-auto flex h-full w-full max-w-[90rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <button
                        ref={menuButton}
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        aria-expanded={menuOpen}
                        aria-controls="admin-menu"
                        aria-label="Open menu"
                        className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
                        <span className="hidden truncate text-zinc-500 sm:inline">{schoolName}</span>
                        {crumbs.map((crumb, index) => (
                            <span key={crumb} className={`flex min-w-0 items-center gap-2 ${index < crumbs.length - 1 ? 'hidden sm:flex' : ''}`}>
                                <ChevronRight className="hidden h-4 w-4 shrink-0 text-zinc-300 sm:block" />
                                <span className={`truncate ${index === crumbs.length - 1 ? 'font-medium text-zinc-900' : 'text-zinc-500'}`}>{crumb}</span>
                            </span>
                        ))}
                    </nav>
                    <a href={siteUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 sm:h-9">
                        <ExternalLink className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">View website</span>
                    </a>
                    </div>
                </header>
                <main className="flex-1">
                    <div className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                                {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
                            </div>
                            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                        </div>
                        {children}
                    </div>
                </main>
            </div>
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
