import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@/admin/AdminLayout';

export default function Login({ schoolName }: { schoolName: string }) {
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/login', { onFinish: () => form.reset('password') });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans text-zinc-900 antialiased">
            <Head title="Sign in · Admin" />
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-lg font-semibold text-white">{schoolName.slice(0, 1)}</span>
                    <h1 className="mt-4 text-xl font-semibold">{schoolName}</h1>
                    <p className="mt-1 text-sm text-zinc-500">Sign in to edit the website</p>
                </div>
                <form onSubmit={submit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div>
                        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                            Email
                        </label>
                        <input id="email" type="email" autoComplete="email" autoFocus value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className={inputClass} />
                        {form.errors.email && <p className="mt-1.5 text-sm text-red-600">{form.errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                            Password
                        </label>
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
                <p className="mt-6 text-center text-xs text-zinc-500">
                    Accounts are created on the server with <code className="rounded bg-zinc-200 px-1">php artisan school:admin</code>
                </p>
            </div>
        </div>
    );
}
