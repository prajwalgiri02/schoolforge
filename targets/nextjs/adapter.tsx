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

export type ContactPayload = { name: string; email: string; phone?: string; subject?: string; message: string };

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
