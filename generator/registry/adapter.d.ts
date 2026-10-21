/**
 * The contract every target's framework adapter implements. Components import
 * `../../adapter`, which resolves to `<school>/adapter.tsx` in a generated project
 * (see targets/<target>/adapter.tsx). This declaration lets tools such as
 * SchoolForge Studio type-check the registry on its own.
 */
import type { ReactNode } from 'react';

export declare function Link(props: { href: string; className?: string; children: ReactNode; 'aria-label'?: string }): ReactNode;

export declare function useCurrentPath(): string;

export type ContactPayload = { name: string; email: string; phone?: string; subject?: string; campus?: string; message: string };

export type ContactResult = { ok: boolean; errors?: Record<string, string> };

export declare function submitContact(payload: ContactPayload): Promise<ContactResult>;

export type FormResult = { ok: boolean; reference?: string; errors?: Record<string, string> };

export type ApplicationStatus = { reference: string; status: string; updatedAt: string };

/** Whether the site has a backend that stores applications so applicants can track them. */
export declare const supportsStatusLookup: boolean;

export declare function submitForm(type: string, data: FormData): Promise<FormResult>;

export declare function lookupApplication(reference: string, email: string): Promise<ApplicationStatus | null>;

export type SubscribePayload = { email?: string; phone?: string; locale?: string };

export declare function subscribe(payload: SubscribePayload): Promise<ContactResult>;

export type ExamSummary = { id: number; name: string };

export type ResultSheet = { exam: string; symbolNumber: string; studentName: string; class: string | null; gpa: string | null; result: string | null; subjects: { subject: string; grade: string }[] };

export declare function listExams(): Promise<ExamSummary[]>;

export declare function lookupResult(exam: number, symbol: string, dob: string): Promise<ResultSheet | null>;
