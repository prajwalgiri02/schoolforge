import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';

export default function Login({ signupEnabled = false }: { signupEnabled?: boolean }) {
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans text-zinc-900">
            <Head title="Sign in" />
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-semibold text-white">SF</span>
                    <h1 className="mt-4 text-xl font-semibold">SchoolForge Studio</h1>
                    <p className="mt-1 text-sm text-zinc-500">Design, edit and generate school websites</p>
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
                {signupEnabled ? (
                    <p className="mt-6 text-center text-sm text-zinc-600">
                        New school?{' '}
                        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Create your school website
                        </Link>
                    </p>
                ) : (
                    <p className="mt-6 text-center text-xs text-zinc-500">
                        Create an account with <code className="rounded bg-zinc-200 px-1">php artisan studio:user</code>
                    </p>
                )}
            </div>
        </div>
    );
}
