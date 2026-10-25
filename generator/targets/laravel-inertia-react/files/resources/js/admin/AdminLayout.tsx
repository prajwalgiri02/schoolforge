import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, ChevronLeft, CircleCheck, ExternalLink, FileText, Inbox, LayoutDashboard, LogOut, Mail, Menu, Megaphone, PanelsTopLeft, UserCog, Users, X, type LucideIcon } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { contentGroups } from './contentGroups';
import type { SharedProps } from './types';
import { Avatar, adminTheme, fontClass } from './ui';
import { useAdminUrl, useSiteUrl } from './urls';

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number; exact?: boolean };

const COLLAPSED_KEY = 'admin-sidebar-collapsed';
const CONTENT_OPEN_KEY = 'admin-content-menu-open';

export function AdminLayout({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
    const { auth, flash, inbox, schoolName, schoolLogo } = usePage<SharedProps>().props;
    const url = usePage().url;
    const admin = useAdminUrl();
    const siteUrl = useSiteUrl();
    const [notice, setNotice] = useState<string | null>(flash.success ?? null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [contentOpen, setContentOpen] = useState(false);
    const menuButton = useRef<HTMLButtonElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        try {
            setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === '1');
            setContentOpen(window.localStorage.getItem(CONTENT_OPEN_KEY) === '1');
        } catch {
            // Storage can be unavailable (private windows); the sidebar then starts expanded.
        }
    }, []);

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
        if (url.split('?')[0].startsWith(admin('/content'))) {
            setContentOpen(true);
        }
    }, [url, admin]);

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

    const toggleContent = () => {
        const next = !contentExpanded;
        setContentOpen(next);

        try {
            window.localStorage.setItem(CONTENT_OPEN_KEY, next ? '1' : '0');
        } catch {
            // Not remembered; the menu still opens and closes.
        }
    };

    const toggleCollapsed = () => {
        setCollapsed((value) => {
            try {
                window.localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1');
            } catch {
                // Not remembered; it still collapses for this page.
            }

            return !value;
        });
    };

    const items: NavItem[] = [
        { href: admin(), label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: admin('/website'), label: 'Pages & design', icon: PanelsTopLeft },
        { href: admin('/messages'), label: 'Messages', icon: Mail, badge: inbox?.messages },
        { href: admin('/submissions'), label: 'Applications', icon: Inbox, badge: inbox?.submissions },
        ...(auth.user?.isAdmin
            ? [
                  { href: admin('/alerts'), label: 'Email alerts', icon: Megaphone },
                  { href: admin('/staff'), label: 'Staff', icon: Users },
              ]
            : []),
        { href: admin('/account'), label: 'Your account', icon: UserCog },
    ];

    const path = url.split('?')[0];
    const isActive = (item: NavItem) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));
    const contentBase = admin('/content');
    const inContent = path === contentBase || path.startsWith(`${contentBase}/`);
    const currentSection = path.startsWith(`${contentBase}/`) ? path.slice(contentBase.length + 1).split('/')[0] : null;
    const contentExpanded = contentOpen;
    const newCount = (inbox?.messages ?? 0) + (inbox?.submissions ?? 0);
    const narrow = collapsed && !menuOpen;
    const itemClass = `flex min-h-11 w-full items-center gap-4 rounded-[10px] px-4 text-base transition ${narrow ? 'lg:justify-center lg:px-0' : ''}`;

    const contentMenu = narrow ? (
        <li>
            <Link href={contentBase} title="Content" aria-current={inContent ? 'page' : undefined} className={`${itemClass} ${inContent ? 'bg-[var(--admin-primary-soft)] text-[var(--admin-heading)]' : 'hover:bg-[var(--admin-hover)]'}`}>
                <FileText className={`h-6 w-6 shrink-0 ${inContent ? 'text-[var(--admin-primary)]' : ''}`} strokeWidth={1.5} />
                <span className="lg:sr-only">Content</span>
            </Link>
        </li>
    ) : (
        <li>
            <button
                type="button"
                onClick={toggleContent}
                aria-expanded={contentExpanded}
                aria-controls="admin-content-menu"
                className={`${itemClass} ${inContent ? 'font-medium text-[var(--admin-heading)]' : 'hover:bg-[var(--admin-hover)] hover:text-[var(--admin-heading)]'}`}
            >
                <FileText className={`h-6 w-6 shrink-0 ${inContent ? 'text-[var(--admin-primary)]' : ''}`} strokeWidth={1.5} />
                <span className="truncate">Content</span>
                <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition ${contentExpanded ? 'rotate-180' : ''}`} />
            </button>
            {contentExpanded && (
                <ul id="admin-content-menu" className="ml-7 mt-1 space-y-0.5 border-l border-[var(--admin-border)] pl-3">
                    <li>
                        <Link
                            href={contentBase}
                            aria-current={path === contentBase ? 'page' : undefined}
                            className={`flex min-h-10 items-center rounded-[8px] px-3 text-sm transition ${path === contentBase ? 'bg-[var(--admin-primary-soft)] font-medium text-[var(--admin-heading)]' : 'hover:bg-[var(--admin-hover)] hover:text-[var(--admin-heading)]'}`}
                        >
                            Overview
                        </Link>
                    </li>
                    {contentGroups.map((group) => {
                        const active = currentSection !== null && group.keys.includes(currentSection);

                        return (
                            <li key={group.title}>
                                <Link
                                    href={admin(`/content/${group.keys[0]}`)}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex min-h-10 items-center rounded-[8px] px-3 text-sm transition ${active ? 'bg-[var(--admin-primary-soft)] font-medium text-[var(--admin-heading)]' : 'hover:bg-[var(--admin-hover)] hover:text-[var(--admin-heading)]'}`}
                                >
                                    {group.title}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>
    );

    return (
        <div style={adminTheme} className={`min-h-screen bg-[var(--admin-canvas)] text-[var(--admin-text)] antialiased lg:flex ${fontClass}`}>
            <Head title={`${title} · Admin`} />
            {menuOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} />}
            <aside
                id="admin-menu"
                className={`${menuOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 w-[272px] max-w-[85vw] flex-col bg-white lg:sticky lg:top-[var(--admin-top,0px)] lg:z-40 lg:flex lg:h-[calc(100vh_-_var(--admin-top,0px))] lg:max-w-none lg:shrink-0 ${narrow ? 'lg:w-[88px]' : ''}`}
            >
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
                    title={collapsed ? 'Expand menu' : 'Collapse menu'}
                    className="absolute -right-3 top-[33px] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--admin-border)] bg-white text-[var(--admin-muted)] shadow-sm transition hover:text-[var(--admin-heading)] lg:flex"
                >
                    <ChevronLeft className={`h-3.5 w-3.5 transition ${collapsed ? 'rotate-180' : ''}`} />
                </button>
                <div className={`flex shrink-0 items-center gap-3 px-6 pb-8 pt-7 ${narrow ? 'lg:justify-center lg:px-0' : ''}`}>
                    <Link href={admin()} className="flex min-w-0 items-center gap-3">
                        {schoolLogo ? (
                            <img src={schoolLogo} alt="" className="h-12 w-12 shrink-0 rounded-[10px] object-contain" />
                        ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[var(--admin-primary)] text-lg font-semibold text-[var(--admin-on-primary)]">{schoolName.slice(0, 1)}</span>
                        )}
                        <span className={`min-w-0 ${narrow ? 'lg:hidden' : ''}`}>
                            <span className="line-clamp-2 text-base font-semibold leading-snug text-[var(--admin-heading)]">{schoolName}</span>
                            <span className="block text-xs text-[var(--admin-muted)]">Admin panel</span>
                        </span>
                    </Link>
                    <button ref={closeButton} type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[var(--admin-muted)] hover:bg-[#eef0f3] lg:hidden">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav aria-label="Admin" className={`flex-1 overflow-y-auto px-5 pb-6 ${narrow ? 'lg:px-4' : ''}`}>
                    <ul className="space-y-2">
                        {items.map((item, index) => {
                            const active = isActive(item);
                            const Icon = item.icon;

                            return (
                                <Fragment key={item.href}>
                                <li>
                                    <Link
                                        href={item.href}
                                        aria-current={active ? 'page' : undefined}
                                        title={narrow ? item.label : undefined}
                                        className={`${itemClass} relative ${active ? 'bg-[var(--admin-primary-soft)] font-medium text-[var(--admin-heading)]' : 'hover:bg-[var(--admin-hover)] hover:text-[var(--admin-heading)]'}`}
                                    >
                                        <Icon className={`h-6 w-6 shrink-0 ${active ? 'text-[var(--admin-primary)]' : ''}`} strokeWidth={1.5} />
                                        <span className={`truncate ${narrow ? 'lg:sr-only' : ''}`}>{item.label}</span>
                                        {item.badge ? (
                                            <span className={`rounded-full bg-[var(--admin-primary)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--admin-on-primary)] ${narrow ? 'lg:absolute lg:right-2 lg:top-1 lg:px-1.5 lg:text-[10px]' : 'ml-auto'}`}>{item.badge}</span>
                                        ) : null}
                                    </Link>
                                </li>
                                {index === 0 && contentMenu}
                                </Fragment>
                            );
                        })}
                        <li>
                            <button type="button" onClick={() => router.post(admin('/logout'))} title={narrow ? 'Sign out' : undefined} className={`${itemClass} hover:bg-[#fdf0f2] hover:text-[#d0102b]`}>
                                <LogOut className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                                <span className={narrow ? 'lg:sr-only' : ''}>Sign out</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col" inert={menuOpen}>
                <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-white lg:top-[var(--admin-top,0px)]">
                    <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-[90px] lg:px-[30px]">
                        <button
                            ref={menuButton}
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            aria-expanded={menuOpen}
                            aria-controls="admin-menu"
                            aria-label="Open menu"
                            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[var(--admin-text)] hover:bg-[#eef0f3] lg:hidden"
                        >
                            <Menu className="h-6 w-6" strokeWidth={1.5} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-semibold text-[var(--admin-heading)] lg:text-2xl">{title}</h1>
                            {description && <p className="hidden truncate text-sm text-[var(--admin-muted)] lg:block">{description}</p>}
                        </div>
                        <a
                            href={siteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[var(--admin-border)] bg-white px-3 text-sm font-medium text-[var(--admin-text)] transition hover:bg-[var(--admin-hover)] lg:h-12 lg:px-4"
                        >
                            <ExternalLink className="h-5 w-5" strokeWidth={1.5} /> <span className="sr-only md:not-sr-only">View website</span>
                        </a>
                        <Link
                            href={admin('/messages')}
                            aria-label={newCount > 0 ? `Inbox, ${newCount} new` : 'Inbox'}
                            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--admin-primary)] text-[var(--admin-on-primary)] transition hover:bg-[var(--admin-primary-hover)] lg:h-12 lg:w-12"
                        >
                            <Bell className="h-6 w-6" strokeWidth={1.5} />
                            {newCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f93642] px-1 text-[10px] font-semibold text-white ring-2 ring-white">{newCount}</span>}
                        </Link>
                        {auth.user && (
                            <Link href={admin('/account')} className="hidden shrink-0 items-center gap-3 rounded-[10px] py-1 pl-1 pr-2 transition hover:bg-[var(--admin-hover)] xl:flex">
                                <Avatar name={auth.user.name} />
                                <span className="max-w-[10rem] leading-tight">
                                    <span className="block truncate text-sm font-medium text-[var(--admin-heading)]">{auth.user.name}</span>
                                    <span className="block truncate text-xs text-[var(--admin-muted)]" title={auth.user.email}>
                                        {auth.user.email}
                                    </span>
                                </span>
                            </Link>
                        )}
                    </div>
                </header>
                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-[30px] lg:py-8">
                    {description && <p className="-mt-1 mb-5 text-sm text-[var(--admin-muted)] lg:hidden">{description}</p>}
                    {actions && <div className="mb-6 flex flex-wrap items-center justify-end gap-3">{actions}</div>}
                    {children}
                </main>
            </div>
            {notice && (
                <div role="status" className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-[12px] bg-[var(--admin-heading)] px-4 py-3 text-sm text-white shadow-lg">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#3cd984]" />
                    <span>{notice}</span>
                    <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-white/60 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

export const inputClass =
    'block w-full rounded-[10px] border border-[var(--admin-border,#d4d4d8)] bg-white px-3.5 py-2.5 text-sm text-[var(--admin-heading,#18181b)] outline-none transition placeholder:text-[#9aa5b1] focus:border-[var(--admin-primary,#18181b)] focus:ring-2 focus:ring-[var(--admin-primary-soft,#e4e4e7)]';

export const buttonClass = {
    primary:
        'inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-[var(--admin-primary,#18181b)] px-4 text-sm font-medium text-[var(--admin-on-primary,#ffffff)] transition hover:bg-[var(--admin-primary-hover,#3f3f46)] disabled:opacity-50',
    secondary:
        'inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-[var(--admin-border,#d4d4d8)] bg-white px-4 text-sm font-medium text-[var(--admin-text,#3f3f46)] transition hover:bg-[var(--admin-hover)] disabled:opacity-50',
    danger: 'inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-3 text-sm font-medium text-[#d0102b] transition hover:bg-[#fde7eb] disabled:opacity-50',
};
