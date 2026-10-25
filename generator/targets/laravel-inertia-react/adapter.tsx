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

export function useFileHref(path: string): string {
    return path;
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

export type FormResult = { ok: boolean; reference?: string; errors?: Record<string, string> };

export type ApplicationStatus = { reference: string; status: string; updatedAt: string };

export const supportsStatusLookup = true;

/** Laravel's CSRF protection reads the XSRF-TOKEN cookie back from this header. */
function csrfHeaders(): Record<string, string> {
    const token = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1];

    return { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}) };
}

/**
 * Plain requests rather than Inertia visits: the form stays on screen and the
 * server answers with the reference number as JSON.
 */
export async function submitForm(type: string, data: FormData): Promise<FormResult> {
    try {
        const response = await fetch(`/forms/${type}`, { method: 'POST', headers: csrfHeaders(), body: data, credentials: 'same-origin' });
        const body = await response.json().catch(() => ({}));

        if (response.ok) {
            return { ok: true, reference: body.reference };
        }

        const errors = Object.fromEntries(Object.entries((body.errors ?? {}) as Record<string, string[]>).map(([field, messages]) => [field, messages[0]]));

        return { ok: false, errors };
    } catch {
        return { ok: false };
    }
}

export async function lookupApplication(reference: string, email: string): Promise<ApplicationStatus | null> {
    try {
        const response = await fetch(`/forms/status?${new URLSearchParams({ reference, email })}`, { headers: csrfHeaders(), credentials: 'same-origin' });

        return response.ok ? ((await response.json()) as ApplicationStatus) : null;
    } catch {
        return null;
    }
}

export type SubscribePayload = { email: string; locale?: string };

export async function subscribe(payload: SubscribePayload): Promise<ContactResult> {
    try {
        const response = await fetch('/subscribe', { method: 'POST', headers: { ...csrfHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
        const body = await response.json().catch(() => ({}));

        if (response.ok) {
            return { ok: true };
        }

        return { ok: false, errors: Object.fromEntries(Object.entries((body.errors ?? {}) as Record<string, string[]>).map(([field, messages]) => [field, messages[0]])) };
    } catch {
        return { ok: false };
    }
}
