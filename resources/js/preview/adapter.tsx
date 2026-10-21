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

    return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true };
}

export type FormResult = { ok: boolean; reference?: string; errors?: Record<string, string> };

export type ApplicationStatus = { reference: string; status: string; updatedAt: string };

/** The preview shows the tracker so schools can see it; lookups return a sample. */
export const supportsStatusLookup = true;

export async function submitForm(type: string, _data: FormData): Promise<FormResult> {
    return { ok: true, reference: `${type.slice(0, 3).toUpperCase()}-PREVIEW` };
}

export async function lookupApplication(reference: string, _email: string): Promise<ApplicationStatus | null> {
    return { reference: reference.toUpperCase(), status: 'reviewing', updatedAt: new Date().toISOString() };
}

export type SubscribePayload = { email?: string; phone?: string; locale?: string };

export async function subscribe(payload: SubscribePayload): Promise<ContactResult> {
    return payload.email || payload.phone ? { ok: true } : { ok: false, errors: { email: 'Enter an email address or a mobile number.' } };
}

export type ExamSummary = { id: number; name: string };

export type ResultSheet = { exam: string; symbolNumber: string; studentName: string; class: string | null; gpa: string | null; result: string | null; subjects: { subject: string; grade: string }[] };

export async function listExams(): Promise<ExamSummary[]> {
    return [{ id: 1, name: 'Annual Examination (sample)' }];
}

export async function lookupResult(_exam: number, symbol: string, _dob: string): Promise<ResultSheet | null> {
    return {
        exam: 'Annual Examination (sample)',
        symbolNumber: symbol,
        studentName: 'Sample Student',
        class: '10 A',
        gpa: '3.75',
        result: 'Passed',
        subjects: ['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies'].map((subject, index) => ({ subject, grade: ['A+', 'A', 'B+', 'A', 'A+'][index] })),
    };
}

export type PaymentGateway = { id: string; label: string };

export type PaymentPayload = { gateway: string; purpose: string; amount: string; student_name: string; class?: string; payer_name: string; email: string; phone?: string };

export type PaymentStart = { ok: boolean; errors?: Record<string, string>; message?: string };

export async function paymentGateways(): Promise<PaymentGateway[]> {
    return [
        { id: 'esewa', label: 'eSewa' },
        { id: 'khalti', label: 'Khalti' },
    ];
}

export async function startPayment(_payload: PaymentPayload): Promise<PaymentStart> {
    return { ok: false, message: 'Payments are simulated in the preview.' };
}
