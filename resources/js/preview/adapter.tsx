/**
 * Framework adapter used when Studio previews a school website. Links stay inside
 * the preview (under /preview/<project>), and the contact form is simulated.
 */
import { Link as InertiaLink, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

type PreviewProps = { base: string };

function withBase(base: string, href: string): string {
    return href === '/' ? base : `${base}${href}`;
}

export function Link({ href, className, children, ...rest }: { href: string; className?: string; children: ReactNode; 'aria-label'?: string }) {
    const { base } = usePage<PreviewProps>().props;

    return (
        <InertiaLink href={withBase(base, href)} className={className} preserveScroll={false} {...rest}>
            {children}
        </InertiaLink>
    );
}

export function useCurrentPath(): string {
    const { base } = usePage<PreviewProps>().props;
    const url = usePage().url.split('?')[0];

    return url.startsWith(base) ? url.slice(base.length) || '/' : url;
}

export type ContactPayload = { name: string; email: string; phone?: string; subject?: string; message: string };

export type ContactResult = { ok: boolean; errors?: Record<string, string> };

export async function submitContact(payload: ContactPayload): Promise<ContactResult> {
    const errors: Record<string, string> = {};

    if (!payload.name?.trim()) {
        errors.name = 'Please tell us your name.';
    }

    if (!payload.email?.includes('@')) {
        errors.email = 'Please enter a valid email address.';
    }

    if (!payload.message?.trim()) {
        errors.message = 'Please write a message.';
    }

    return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}
