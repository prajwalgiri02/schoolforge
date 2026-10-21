import { Link, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { AuthCard } from '@/admin/AuthCard';
import { buttonClass, inputClass } from '@/admin/AdminLayout';

export default function TwoFactorChallenge({ schoolName }: { schoolName: string }) {
    const form = useForm({ code: '' });
    const [recovery, setRecovery] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/two-factor', { onFinish: () => form.reset('code') });
    };

    return (
        <AuthCard schoolName={schoolName} title="Two-factor sign-in" subtitle={recovery ? 'Enter one of your recovery codes' : 'Enter the 6-digit code from your authenticator app'} footer={<Link href="/admin/login">Back to sign in</Link>}>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="code" className="mb-1.5 block text-sm font-medium">
                        {recovery ? 'Recovery code' : 'Code'}
                    </label>
                    <input
                        id="code"
                        autoFocus
                        autoComplete="one-time-code"
                        inputMode={recovery ? 'text' : 'numeric'}
                        value={form.data.code}
                        onChange={(event) => form.setData('code', event.target.value)}
                        placeholder={recovery ? 'ABCDE-FGHIJ' : '123456'}
                        className={`${inputClass} text-center font-mono text-lg tracking-widest`}
                    />
                    {form.errors.code && <p className="mt-1.5 text-sm text-red-600">{form.errors.code}</p>}
                </div>
                <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                    Verify
                </button>
                <button type="button" onClick={() => setRecovery(!recovery)} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 hover:underline">
                    {recovery ? 'Use my authenticator app instead' : 'Lost your phone? Use a recovery code'}
                </button>
            </form>
        </AuthCard>
    );
}
