import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedProps } from './types';
import { AdminFont, adminTheme, fontClass } from './ui';

/**
 * Split screen for the signed-out admin pages (sign in, two-factor, password reset):
 * the school's mark on the left, the form on the right.
 */
export function AuthCard({ schoolName, title, subtitle, children, footer }: { schoolName: string; title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
    const { flash, schoolLogo } = usePage<SharedProps>().props;

    return (
        <div style={adminTheme} className={`flex min-h-screen bg-white p-0 text-[var(--admin-text)] antialiased lg:p-6 ${fontClass}`}>
            <Head title={`${title} · Admin`} />
            <AdminFont />
            <div className="relative hidden w-[45%] max-w-[640px] flex-col items-center justify-center overflow-hidden rounded-[24px] bg-[#0e2741] p-12 text-center lg:flex">
                <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#2d6495]/40 blur-3xl" />
                <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#9fc2e0]/20 blur-3xl" />
                {schoolLogo ? (
                    <img src={schoolLogo} alt="" className="relative h-32 w-32 rounded-[24px] bg-white object-contain p-3" />
                ) : (
                    <span className="relative flex h-32 w-32 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#3a7bb5] to-[#1d4670] text-6xl font-semibold text-white shadow-2xl">{schoolName.slice(0, 1)}</span>
                )}
                <p className="relative mt-8 text-4xl font-medium tracking-tight text-[#cfe2f3]">{schoolName}</p>
                <p className="relative mt-3 text-base text-[#9fc2e0]">Website admin panel</p>
            </div>
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-[360px]">
                    <div className="mb-8">
                        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[var(--admin-primary)] text-lg font-semibold text-white lg:hidden">{schoolName.slice(0, 1)}</span>
                        <h1 className="text-3xl font-semibold text-[var(--admin-heading)]">{title}</h1>
                        <p className="mt-2 text-sm text-[var(--admin-muted)]">{subtitle}</p>
                    </div>
                    {flash.success && (
                        <p role="status" className="mb-5 rounded-[10px] border border-[#bfe8cd] bg-[#effaf3] px-4 py-3 text-sm text-[#1f8a45]">
                            {flash.success}
                        </p>
                    )}
                    <div className="space-y-5 [&_input:not([type=checkbox])]:bg-[#f3f4f5]">{children}</div>
                    {footer && <div className="mt-8 text-center text-sm text-[var(--admin-muted)]">{footer}</div>}
                </div>
            </div>
        </div>
    );
}
