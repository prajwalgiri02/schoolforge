/**
 * Framework adapter used when Studio shows a school website. In the preview,
 * links stay inside /preview/<project> and forms are simulated. When Studio
 * hosts a published school (see setHostedMode), forms are sent to Studio.
 */
import { Link as InertiaLink, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

type PreviewProps = { base: string };

let hosted = false;

/** The preview shows the tracker so schools can see it; hosted sites have no lookup. */
export let supportsStatusLookup = true;

/** Called by the page on every render: true for a published school Studio hosts. */
export function setHostedMode(isHosted: boolean): void {
    hosted = isHosted;
    supportsStatusLookup = !isHosted;
}

async function send(url: string, body: BodyInit, json = false): Promise<{ status: number; data: Record<string, unknown> }> {
    try {
        const response = await fetch(url, { method: 'POST', body, headers: { Accept: 'application/json', ...(json ? { 'Content-Type': 'application/json' } : {}) } });

        return { status: response.status, data: await response.json().catch(() => ({})) };
    } catch {
        return { status: 0, data: {} };
    }
}

function firstErrors(data: Record<string, unknown>, status: number): Record<string, string> {
    const errors = (data.errors ?? {}) as Record<string, string[]>;
    const flattened = Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]));

    if (Object.keys(flattened).length === 0) {
        flattened.form = status === 429 ? 'Too many attempts. Please try again in a minute.' : 'Something went wrong. Please try again.';
    }

    return flattened;
}

function withBase(base: string, href: string): string {
    return href === '/' ? base || '/' : `${base}${href}`;
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

export function useFileHref(path: string): string {
    return withBase(usePage<PreviewProps>().props.base, path);
}

export type ContactPayload = { name: string; email: string; phone?: string; subject?: string; campus?: string; message: string };

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

    if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
    }

    if (!hosted) {
        return { ok: true };
    }

    const { status, data } = await send('/_school/contact', JSON.stringify(payload), true);

    return status === 201 ? { ok: true } : { ok: false, errors: firstErrors(data, status) };
}

export type FormResult = { ok: boolean; reference?: string; errors?: Record<string, string> };

export type ApplicationStatus = { reference: string; status: string; updatedAt: string };

export async function submitForm(type: string, data: FormData): Promise<FormResult> {
    if (!hosted) {
        return { ok: true, reference: `${type.slice(0, 3).toUpperCase()}-PREVIEW` };
    }

    const { status, data: result } = await send(`/_school/forms/${type}`, data);

    return status === 201 ? { ok: true, reference: String(result.reference) } : { ok: false, errors: firstErrors(result, status) };
}

export async function lookupApplication(reference: string, _email: string): Promise<ApplicationStatus | null> {
    if (hosted) {
        return null;
    }

    return { reference: reference.toUpperCase(), status: 'reviewing', updatedAt: new Date().toISOString() };
}

export type SubscribePayload = { email: string; locale?: string };

export async function subscribe(payload: SubscribePayload): Promise<ContactResult> {
    if (!payload.email) {
        return { ok: false, errors: { email: 'Enter your email address.' } };
    }

    if (!hosted) {
        return { ok: true };
    }

    const { status, data } = await send('/_school/subscribe', JSON.stringify(payload), true);

    return status === 201 ? { ok: true } : { ok: false, errors: firstErrors(data, status) };
}
