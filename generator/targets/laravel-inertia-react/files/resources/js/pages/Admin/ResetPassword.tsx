import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthCard } from '@/admin/AuthCard';
import { buttonClass, inputClass } from '@/admin/AdminLayout';
import { useAdminUrl } from '@/admin/urls';

export default function ResetPassword({ schoolName, token, email }: { schoolName: string; token: string; email: string }) {
    const admin = useAdminUrl();
    const form = useForm({ token, email, password: '', password_confirmation: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(admin('/reset-password'), { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <AuthCard schoolName={schoolName} title="Choose a password" subtitle="Choose a password for your admin account">
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
                        Email
                    </label>
                    <input id="email" type="email" autoComplete="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className={inputClass} />
                    {form.errors.email && <p className="mt-1.5 text-sm text-red-600">{form.errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
                        New password
                    </label>
                    <input id="password" type="password" autoComplete="new-password" autoFocus value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className={inputClass} />
                    {form.errors.password && <p className="mt-1.5 text-sm text-red-600">{form.errors.password}</p>}
                </div>
                <div>
                    <label htmlFor="password_confirmation" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
                        Repeat the password
                    </label>
                    <input id="password_confirmation" type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} className={inputClass} />
                </div>
                <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                    Save password
                </button>
            </form>
        </AuthCard>
    );
}
