import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Colours of the admin panel, worked out from the school's theme (and any colours chosen
 * in Pages & design). Pages set them on their root with `adminTheme`; the shared field
 * and account components fall back to neutral colours when Studio uses them.
 */
export const adminTheme = {
    '--admin-primary': 'var(--color-primary, #1b365d)',
    '--admin-on-primary': 'var(--color-primary-foreground, #ffffff)',
    '--admin-primary-hover': 'color-mix(in oklab, var(--color-primary, #1b365d) 82%, black)',
    '--admin-primary-soft': 'color-mix(in oklab, var(--color-primary, #1b365d) 11%, white)',
    '--admin-accent': 'var(--color-accent, #c9a227)',
    '--admin-accent-text': 'var(--color-accent-strong, color-mix(in oklab, var(--color-accent, #c9a227) 55%, black))',
    '--admin-accent-soft': 'color-mix(in oklab, var(--color-accent, #c9a227) 18%, white)',
    '--admin-heading': 'color-mix(in oklab, var(--color-primary, #1b365d) 25%, #111827)',
    '--admin-text': '#3f4756',
    '--admin-muted': '#5d6878',
    '--admin-border': '#e4e7eb',
    '--admin-canvas': 'color-mix(in oklab, var(--color-primary, #1b365d) 3%, #f6f7f9)',
    '--admin-hover': 'color-mix(in oklab, var(--color-primary, #1b365d) 5%, white)',
} as CSSProperties;

export const fontClass = 'font-[family-name:var(--font-body,ui-sans-serif,system-ui,sans-serif)]';

export type Tone = 'primary' | 'accent' | 'green' | 'orange' | 'red' | 'grey';

const tones: Record<Tone, { badge: string; tile: string }> = {
    primary: { badge: 'bg-[var(--admin-primary-soft)] text-[var(--admin-primary)]', tile: 'bg-[var(--admin-primary-soft)] text-[var(--admin-primary)]' },
    accent: { badge: 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]', tile: 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]' },
    green: { badge: 'bg-[#ceecd7] text-[#1f8a45]', tile: 'bg-[#dff5e6] text-[#31b057]' },
    orange: { badge: 'bg-[#ffeedb] text-[#c76a00]', tile: 'bg-[#ffeedb] text-[#f08910]' },
    red: { badge: 'bg-[#fde7eb] text-[#d0102b]', tile: 'bg-[#fde7eb] text-[#e11d38]' },
    grey: { badge: 'bg-[#eef0f3] text-[#56687a]', tile: 'bg-[#eef0f3] text-[#56687a]' },
};

export function Badge({ tone = 'grey', children }: { tone?: Tone; children: ReactNode }) {
    return <span className={`inline-flex items-center whitespace-nowrap rounded-[12px] px-3 py-1 text-xs font-medium ${tones[tone].badge}`}>{children}</span>;
}

export function IconTile({ icon: Icon, tone = 'primary', size = 'lg' }: { icon: LucideIcon; tone?: Tone; size?: 'lg' | 'sm' }) {
    return (
        <span className={`flex shrink-0 items-center justify-center ${tones[tone].tile} ${size === 'lg' ? 'h-14 w-14 rounded-[10px]' : 'h-9 w-9 rounded-[8px]'}`}>
            <Icon className={size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'} strokeWidth={1.5} />
        </span>
    );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');

    return (
        <span
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary,#18181b)] font-medium text-[var(--admin-on-primary,#ffffff)] ${size === 'lg' ? 'h-16 w-16 text-xl' : 'h-7 w-7 text-[10px]'}`}
        >
            {initials || '?'}
        </span>
    );
}

export function Card({ title, actions, children, className = '', padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
    return (
        <section className={`rounded-[20px] border border-[var(--admin-border,#e4e4e7)] bg-white ${padded ? 'p-5 sm:p-6' : ''} ${className}`}>
            {(title || actions) && (
                <header className={`flex flex-wrap items-center justify-between gap-3 ${padded ? 'mb-5' : 'px-5 pb-4 pt-5 sm:px-6 sm:pt-6'}`}>
                    {title && <h2 className="text-lg font-semibold text-[var(--admin-heading,#18181b)] sm:text-xl sm:font-medium">{title}</h2>}
                    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
                </header>
            )}
            {children}
        </section>
    );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
    return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
            <IconTile icon={Icon} tone="primary" />
            <p className="mt-4 text-base font-medium text-[var(--admin-heading,#18181b)]">{title}</p>
            {children && <p className="mt-1 max-w-md text-sm text-[var(--admin-muted,#71717a)]">{children}</p>}
        </div>
    );
}

export const table = {
    wrap: 'relative overflow-x-auto',
    table: 'w-full min-w-[40rem] text-left text-sm',
    head: 'border-b border-[var(--admin-border,#e4e4e7)] text-sm font-normal text-[var(--admin-muted,#71717a)]',
    th: 'px-5 pb-3 font-normal sm:px-6',
    row: 'transition hover:bg-[var(--admin-hover,#fafafa)]',
    td: 'px-5 py-3 text-[var(--admin-muted,#52525b)] sm:px-6',
};

export const filterClass =
    'h-9 rounded-[8px] border border-[var(--admin-border,#e4e4e7)] bg-white px-2.5 text-xs text-[var(--admin-muted,#52525b)] outline-none transition focus:border-[var(--admin-primary,#18181b)]';

export function IconLink({ href, label, icon: Icon, danger = false }: { href: string; label: string; icon: LucideIcon; danger?: boolean }) {
    return (
        <Link href={href} aria-label={label} title={label} className={`inline-flex h-9 w-9 items-center justify-center rounded-[8px] transition ${danger ? 'text-[#e11d38] hover:bg-[#fde7eb]' : 'text-[var(--admin-muted,#52525b)] hover:bg-[#eef0f3]'}`}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </Link>
    );
}

export function Pagination({ links }: { links: { url: string | null; label: string; active: boolean }[] }) {
    if (links.length <= 3) {
        return null;
    }

    const label = (value: string) => value.replace('&laquo;', '«').replace('&raquo;', '»');

    return (
        <nav aria-label="Pagination" className="mt-6 flex flex-wrap justify-center gap-1">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        className={`min-w-9 rounded-[8px] px-3 py-1.5 text-center text-sm ${link.active ? 'bg-[var(--admin-primary,#18181b)] text-[var(--admin-on-primary,#ffffff)]' : 'text-[var(--admin-text,#3f3f46)] hover:bg-white'}`}
                    >
                        {label(link.label)}
                    </Link>
                ) : (
                    <span key={index} className="px-3 py-1.5 text-sm text-zinc-300">
                        {label(link.label)}
                    </span>
                ),
            )}
        </nav>
    );
}

const statusTones: Record<string, Tone> = {
    received: 'primary',
    pending: 'orange',
    reviewing: 'orange',
    interview: 'accent',
    accepted: 'green',
    approved: 'green',
    hired: 'green',
    waitlisted: 'grey',
    rejected: 'red',
};

export function StatusBadge({ status }: { status: string }) {
    return <Badge tone={statusTones[status] ?? 'grey'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}
