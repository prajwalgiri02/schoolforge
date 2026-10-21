import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { TwoFactorCodeForm } from '@admin/TwoFactorCodeForm';

export default function TwoFactor() {
    const [recovery, setRecovery] = useState(false);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans text-zinc-900">
            <Head title="Two-factor sign-in" />
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-semibold text-white">SF</span>
                    <h1 className="mt-4 text-xl font-semibold">Two-factor sign-in</h1>
                    <p className="mt-1 text-sm text-zinc-500">{recovery ? 'Enter one of your recovery codes' : 'Enter the 6-digit code from your authenticator app'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <TwoFactorCodeForm action="/two-factor" onModeChange={setRecovery} />
                </div>
                <p className="mt-4 text-center text-sm">
                    <Link href="/login" className="text-zinc-500 hover:text-zinc-900 hover:underline">
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
