import type { ReactNode } from 'react';
import { SmartLink } from './link';
import { Icon } from './icons';
import type { ImageRef } from './types';

export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

export { isInternalHref, SmartLink } from './link';

export function Container({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

const sectionTones = {
    default: 'bg-background text-foreground',
    muted: 'bg-muted text-foreground',
    surface: 'bg-surface text-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
} as const;

export type SectionTone = keyof typeof sectionTones;

export function Section({ id, tone = 'default', className, children }: { id?: string; tone?: SectionTone; className?: string; children: ReactNode }) {
    return (
        <section id={id} className={cn('school-section py-16 md:py-24', sectionTones[tone] ?? sectionTones.default, className)}>
            {children}
        </section>
    );
}

export function SectionHeading({
    eyebrow,
    title,
    subtitle,
    align = 'center',
    invert = false,
    className,
}: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    align?: 'center' | 'left';
    invert?: boolean;
    className?: string;
}) {
    if (!title && !eyebrow) {
        return null;
    }

    return (
        <div className={cn('mb-10 md:mb-14', align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl', className)}>
            {eyebrow && <p className={cn('school-eyebrow mb-3', invert ? 'text-accent' : 'text-accent-strong')}>{eyebrow}</p>}
            {title && <h2 className="school-heading text-3xl md:text-4xl">{title}</h2>}
            {title && <span className={cn('school-rule mt-5', align === 'center' && 'mx-auto')} aria-hidden="true" />}
            {subtitle && <p className={cn('mt-5 text-lg leading-relaxed', invert ? 'opacity-85' : 'text-muted-foreground')}>{subtitle}</p>}
        </div>
    );
}

const buttonVariants = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110',
    secondary: 'bg-secondary text-secondary-foreground hover:brightness-110',
    accent: 'bg-accent text-accent-foreground hover:brightness-105',
    outline: 'border border-current text-primary hover:bg-primary hover:text-primary-foreground',
    light: 'bg-white text-gray-900 hover:bg-white/90',
    ghost: 'text-current underline-offset-4 hover:underline',
    outlineLight: 'border border-white/70 text-white hover:bg-white hover:text-gray-900',
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function ButtonLink({
    href,
    variant = 'primary',
    size = 'md',
    className,
    children,
}: {
    href: string;
    variant?: ButtonVariant;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    children: ReactNode;
}) {
    const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-7 py-3.5 text-base' };

    return (
        <SmartLink
            href={href}
            className={cn(
                'school-button inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                sizes[size],
                buttonVariants[variant],
                className,
            )}
        >
            {children}
        </SmartLink>
    );
}

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter((part) => /^[A-Za-z]/.test(part) && !/^(dr|mr|mrs|ms|prof)\.?$/i.test(part))
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

/**
 * srcset for images uploaded through SchoolForge, which are stored as `<name>.r.webp`
 * plus `<name>.<width>.webp` copies (see ImageOptimizer.php). Other images get none.
 */
export function responsiveSrcSet(src: string): string | undefined {
    if (!src.endsWith('.r.webp')) {
        return undefined;
    }

    const base = src.slice(0, -'.r.webp'.length);

    return [480, 960, 1440].map((width) => `${base}.${width}.webp ${width}w`).concat(`${src} 1920w`).join(', ');
}

/**
 * Renders an image, or a themed artwork placeholder when no image is configured,
 * so a school can launch before its photography is ready. Pass icon="none" for backgrounds.
 * Set `priority` for the main image above the fold so it loads first.
 */
export function Media({
    src,
    alt,
    className,
    icon = 'graduation-cap',
    label,
    sizes = '100vw',
    priority = false,
}: {
    src?: ImageRef;
    alt: string;
    className?: string;
    icon?: string;
    label?: string;
    sizes?: string;
    priority?: boolean;
}) {
    if (src) {
        const srcSet = responsiveSrcSet(src);

        return (
            <img
                src={src}
                srcSet={srcSet}
                sizes={srcSet ? sizes : undefined}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : undefined}
                decoding="async"
                className={cn('h-full w-full object-cover', className)}
            />
        );
    }

    return (
        <div role="img" aria-label={alt} className={cn('school-placeholder relative flex h-full w-full items-center justify-center overflow-hidden', className)}>
            {icon !== 'none' && (
                <div className="flex flex-col items-center gap-3 text-primary-foreground/90">
                    <Icon name={icon} className="h-10 w-10" />
                    {label && <span className="px-4 text-center text-sm font-medium tracking-wide">{label}</span>}
                </div>
            )}
        </div>
    );
}

export function Avatar({ src, name, className }: { src?: ImageRef; name: string; className?: string }) {
    if (src) {
        const srcSet = responsiveSrcSet(src);

        return <img src={src} srcSet={srcSet} sizes={srcSet ? '96px' : undefined} alt={name} loading="lazy" decoding="async" className={cn('rounded-full object-cover', className)} />;
    }

    return (
        <span aria-hidden="true" className={cn('school-avatar inline-flex items-center justify-center rounded-full font-semibold', className)}>
            {initials(name)}
        </span>
    );
}

export function formatDate(value: string | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
    if (!value) {
        return '';
    }

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', options).format(date);
}

export function dateParts(value: string): { day: string; month: string; year: string } {
    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return { day: '', month: value, year: '' };
    }

    return {
        day: String(date.getDate()),
        month: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
        year: String(date.getFullYear()),
    };
}

export function limitItems<T>(items: T[] | undefined, limit: unknown): T[] {
    const list = items ?? [];

    return typeof limit === 'number' && limit > 0 ? list.slice(0, limit) : list;
}
