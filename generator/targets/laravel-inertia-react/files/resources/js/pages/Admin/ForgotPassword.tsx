import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthCard } from '@/admin/AuthCard';
import { buttonClass, inputClass } from '@/admin/AdminLayout';
import { useAdminUrl } from '@/admin/urls';

export default function ForgotPassword({ schoolName }: { schoolName: string }) {
    const admin = useAdminUrl();
    const form = useForm({ email: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(admin('/forgot-password'));
    };

    return (
        <AuthCard schoolName={schoolName} title="Forgot password" subtitle="We will email you a link to choose a new password" footer={<Link href={admin('/login')}>Back to sign in</Link>}>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm text-[var(--admin-muted)]">
                        Email
                    </label>
                    <input id="email" type="email" autoComplete="email" autoFocus value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className={inputClass} />
                    {form.errors.email && <p className="mt-1.5 text-sm text-red-600">{form.errors.email}</p>}
                </div>
                <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                    Email me a link
                </button>
            </form>
        </AuthCard>
    );
}
