import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { AuthCard } from '@/admin/AuthCard';
import { buttonClass, inputClass } from '@/admin/AdminLayout';
import { useAdminUrl } from '@/admin/urls';

export default function Login({ schoolName }: { schoolName: string }) {
    const admin = useAdminUrl();
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(admin('/login'), { onFinish: () => form.reset('password') });
    };

    return (
        <AuthCard schoolName={schoolName} title="Sign in" subtitle="Sign in to edit the website">
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                        Email
                    </label>
                    <input id="email" type="email" autoComplete="email" autoFocus value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className={inputClass} />
                    {form.errors.email && <p className="mt-1.5 text-sm text-red-600">{form.errors.email}</p>}
                </div>
                <div>
                    <div className="mb-1.5 flex items-baseline justify-between">
                        <label htmlFor="password" className="block text-sm font-medium">
                            Password
                        </label>
                        <Link href={admin('/forgot-password')} className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">
                            Forgot your password?
                        </Link>
                    </div>
                    <input id="password" type="password" autoComplete="current-password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className={inputClass} />
                    {form.errors.password && <p className="mt-1.5 text-sm text-red-600">{form.errors.password}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                    <input type="checkbox" checked={form.data.remember} onChange={(event) => form.setData('remember', event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                    Keep me signed in
                </label>
                <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                    {form.processing ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </AuthCard>
    );
}
