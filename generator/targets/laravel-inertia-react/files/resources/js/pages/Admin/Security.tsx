import { router, useForm } from '@inertiajs/react';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';

type Props = { twoFactorEnabled: boolean; setup: { secret: string; uri: string } | null; recoveryCodes: string[] | null; recoveryCodesLeft: number };

const errorText = (message?: string) => message && <p className="mt-1.5 text-sm text-red-600">{message}</p>;

export default function Security({ twoFactorEnabled, setup, recoveryCodes, recoveryCodesLeft }: Props) {
    const password = useForm({ current_password: '', password: '', password_confirmation: '' });
    const confirm = useForm({ code: '' });
    const disable = useForm({ current_password: '' });

    const changePassword = (event: FormEvent) => {
        event.preventDefault();
        password.put('/admin/account/password', { preserveScroll: true, onSuccess: () => password.reset() });
    };

    return (
        <AdminLayout title="Your account">
            <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={changePassword} className="h-fit space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <KeyRound className="h-4 w-4" /> Password
                    </h2>
                    {(
                        [
                            ['current_password', 'Current password', 'current-password'],
                            ['password', 'New password', 'new-password'],
                            ['password_confirmation', 'Repeat new password', 'new-password'],
                        ] as const
                    ).map(([field, label, autoComplete]) => (
                        <div key={field}>
                            <label htmlFor={field} className="mb-1.5 block text-sm font-medium">
                                {label}
                            </label>
                            <input id={field} type="password" autoComplete={autoComplete} value={password.data[field]} onChange={(event) => password.setData(field, event.target.value)} className={inputClass} />
                            {errorText(password.errors[field])}
                        </div>
                    ))}
                    <button type="submit" disabled={password.processing} className={buttonClass.primary}>
                        Change password
                    </button>
                </form>

                <section className="h-fit space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <ShieldCheck className="h-4 w-4" /> Two-factor sign-in
                    </h2>
                    {twoFactorEnabled ? (
                        <>
                            <p className="text-sm text-zinc-600">On. After your password, you also enter a code from your authenticator app. {recoveryCodesLeft} recovery codes left.</p>
                            {recoveryCodes && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-sm font-medium text-amber-900">Save these recovery codes. Each works once if you lose your phone; they are not shown again.</p>
                                    <ul className="mt-3 grid grid-cols-2 gap-1 font-mono text-sm">
                                        {recoveryCodes.map((code) => (
                                            <li key={code}>{code}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <button type="button" onClick={() => router.post('/admin/account/two-factor/recovery-codes', {}, { preserveScroll: true })} className={buttonClass.secondary}>
                                New recovery codes
                            </button>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    disable.delete('/admin/account/two-factor', { preserveScroll: true, onSuccess: () => disable.reset() });
                                }}
                                className="space-y-2 border-t border-zinc-100 pt-4"
                            >
                                <label htmlFor="disable-password" className="block text-sm font-medium">
                                    Turn off (enter your password)
                                </label>
                                <div className="flex gap-2">
                                    <input id="disable-password" type="password" autoComplete="current-password" value={disable.data.current_password} onChange={(event) => disable.setData('current_password', event.target.value)} className={inputClass} />
                                    <button type="submit" disabled={disable.processing} className={buttonClass.danger}>
                                        <ShieldOff className="h-4 w-4" /> Turn off
                                    </button>
                                </div>
                                {errorText(disable.errors.current_password)}
                            </form>
                        </>
                    ) : setup ? (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                confirm.post('/admin/account/two-factor/confirm', { preserveScroll: true });
                            }}
                            className="space-y-4"
                        >
                            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-600">
                                <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, Authy…).</li>
                                <li>
                                    Add an account by entering this setup key: <code className="block break-all rounded bg-zinc-100 px-2 py-1.5 font-mono text-zinc-900">{setup.secret}</code>
                                    <a href={setup.uri} className="text-xs text-zinc-500 underline">
                                        or open the setup link on this device
                                    </a>
                                </li>
                                <li>Type the 6-digit code the app shows.</li>
                            </ol>
                            <div className="flex gap-2">
                                <input aria-label="Code from the app" inputMode="numeric" autoComplete="one-time-code" value={confirm.data.code} onChange={(event) => confirm.setData('code', event.target.value)} placeholder="123456" className={`${inputClass} font-mono tracking-widest`} />
                                <button type="submit" disabled={confirm.processing} className={buttonClass.primary}>
                                    Turn on
                                </button>
                            </div>
                            {errorText(confirm.errors.code)}
                        </form>
                    ) : (
                        <>
                            <p className="text-sm text-zinc-600">Protect the admin panel even if someone learns your password: sign-in will also ask for a code from your phone.</p>
                            <button type="button" onClick={() => router.post('/admin/account/two-factor', {}, { preserveScroll: true })} className={buttonClass.primary}>
                                Set up two-factor sign-in
                            </button>
                        </>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
