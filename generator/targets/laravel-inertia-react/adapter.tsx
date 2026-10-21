/**
 * Framework adapter for Laravel + Inertia. Section components only talk to the
 * framework through this file, which is what lets the same components run on Next.js.
 */
import { Link as InertiaLink, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

export function Link({ href, className, children, ...rest }: { href: string; className?: string; children: ReactNode; 'aria-label'?: string }) {
    return (
        <InertiaLink href={href} className={className} {...rest}>
            {children}
        </InertiaLink>
    );
}

export function useCurrentPath(): string {
    return usePage().url;
}

export type ContactPayload = { name: string; email: string; phone?: string; subject?: string; campus?: string; message: string };

export type ContactResult = { ok: boolean; errors?: Record<string, string> };

export function submitContact(payload: ContactPayload): Promise<ContactResult> {
    return new Promise((resolve) => {
        router.post('/contact', payload, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => resolve({ ok: true }),
            onError: (errors) => resolve({ ok: false, errors: errors as Record<string, string> }),
            onFinish: () => resolve({ ok: false }),
        });
    });
}
