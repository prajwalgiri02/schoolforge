import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedProps } from './types';

/**
 * Centered card for the signed-out admin pages (sign in, two-factor, password reset).
 */
export function AuthCard({ schoolName, title, subtitle, children, footer }: { schoolName: string; title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
    const { flash } = usePage<SharedProps>().props;

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans text-zinc-900 antialiased">
            <Head title={`${title} · Admin`} />
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-lg font-semibold text-white">{schoolName.slice(0, 1)}</span>
                    <h1 className="mt-4 text-xl font-semibold">{schoolName}</h1>
                    <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
                </div>
                {flash.success && (
                    <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </p>
                )}
                <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">{children}</div>
                {footer && <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>}
            </div>
        </div>
    );
}
