import { Head, Link, router, usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck, Component, FolderKanban, Images, LogOut, Palette, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { StudioSharedProps } from './types';

function FlashMessage() {
    const { flash } = usePage<StudioSharedProps>().props;
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const next = flash.error ? { type: 'error' as const, text: flash.error } : flash.success ? { type: 'success' as const, text: flash.success } : null;
        setMessage(next);

        if (!next) {
            return;
        }

        const timer = window.setTimeout(() => setMessage(null), 4500);

        return () => window.clearTimeout(timer);
    }, [flash.success, flash.error]);

    if (!message) {
        return null;
    }

    return (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg">
            {message.type === 'success' ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />}
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss" className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

/**
 * Chrome shared by every Studio page: top navigation, flash messages and page title.
 */
export function StudioLayout({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
    const { auth } = usePage<StudioSharedProps>().props;
    const url = usePage().url;

    const nav = [
        { href: '/', label: 'Schools', icon: FolderKanban, active: url === '/' || url.startsWith('/projects') },
        { href: '/themes', label: 'Themes', icon: Palette, active: url.startsWith('/themes') },
        { href: '/components', label: 'Components', icon: Component, active: url.startsWith('/components') },
        { href: '/media', label: 'Media', icon: Images, active: url.startsWith('/media') },
    ];

    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
            <Head title={title} />
            <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
                <div className={`mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 ${wide ? 'max-w-[110rem]' : 'max-w-7xl'}`}>
                    <Link href="/" className="flex items-center gap-2.5 font-semibold">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm text-white">SF</span>
                        <span className="hidden sm:inline">SchoolForge Studio</span>
                    </Link>
                    <nav className="flex items-center gap-1">
                        {nav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${item.active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`}
                            >
                                <item.icon className="h-4 w-4" />
                                <span className="hidden md:inline">{item.label}</span>
                            </Link>
                        ))}
                        <button
                            type="button"
                            onClick={() => router.post('/logout')}
                            title={auth.user ? `Signed in as ${auth.user.email}` : undefined}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden md:inline">Sign out</span>
                        </button>
                    </nav>
                </div>
            </header>
            {children}
            <FlashMessage />
        </div>
    );
}

export function PageHeading({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description && <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

export function Swatch({ colors, className = 'h-6 w-6' }: { colors: Record<string, string>; className?: string }) {
    return (
        <span className="flex -space-x-1.5">
            {['primary', 'secondary', 'accent', 'background'].map((key) =>
                colors[key] ? <span key={key} title={`${key}: ${colors[key]}`} className={`${className} rounded-full border-2 border-white shadow-sm`} style={{ background: colors[key] }} /> : null,
            )}
        </span>
    );
}

export function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1.5 text-sm text-red-600">{message}</p> : null;
}
