'use client';

/**
 * Framework adapter for Next.js. Section components only talk to the framework
 * through this file, which is what lets the same components run on Laravel + Inertia.
 */
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function Link({ href, className, children, ...rest }: { href: string; className?: string; children: ReactNode; 'aria-label'?: string }) {
    return (
        <NextLink href={href} className={className} {...rest}>
            {children}
        </NextLink>
    );
}

export function useCurrentPath(): string {
    return usePathname() ?? '/';
}

export type ContactPayload = { name: string; email: string; phone?: string; subject?: string; campus?: string; message: string };

export type ContactResult = { ok: boolean; errors?: Record<string, string> };

export async function submitContact(payload: ContactPayload): Promise<ContactResult> {
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            return { ok: true };
        }

        const body = await response.json().catch(() => ({}));

        return { ok: false, errors: body.errors };
    } catch {
        return { ok: false };
    }
}

export type FormResult = { ok: boolean; reference?: string; errors?: Record<string, string> };

export type ApplicationStatus = { reference: string; status: string; updatedAt: string };

/** Next.js sites forward applications to a webhook and do not store them, so there is nothing to track. */
export const supportsStatusLookup = false;

export async function submitForm(type: string, data: FormData): Promise<FormResult> {
    try {
        const response = await fetch(`/api/forms/${type}`, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
        const body = await response.json().catch(() => ({}));

        return response.ok ? { ok: true, reference: body.reference } : { ok: false, errors: body.errors };
    } catch {
        return { ok: false };
    }
}

export async function lookupApplication(_reference: string, _email: string): Promise<ApplicationStatus | null> {
    return null;
}

export type SubscribePayload = { email?: string; phone?: string; locale?: string };

export async function subscribe(payload: SubscribePayload): Promise<ContactResult> {
    try {
        const response = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        const body = await response.json().catch(() => ({}));

        return response.ok ? { ok: true } : { ok: false, errors: body.errors };
    } catch {
        return { ok: false };
    }
}
