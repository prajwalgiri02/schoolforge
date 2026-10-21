import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError } from '@/studio/StudioLayout';

type Field = { key: 'school_name' | 'address' | 'phone' | 'name' | 'email' | 'password' | 'password_confirmation'; label: string; type?: string; autoComplete?: string; placeholder?: string; optional?: boolean };

const schoolFields: Field[] = [
    { key: 'school_name', label: 'School name', autoComplete: 'organization', placeholder: 'e.g. Gyan Jyoti Secondary School' },
    { key: 'address', label: 'Address', autoComplete: 'street-address', placeholder: 'e.g. Baneshwor, Kathmandu', optional: true },
    { key: 'phone', label: 'School phone', type: 'tel', autoComplete: 'tel', optional: true },
];

const accountFields: Field[] = [
    { key: 'name', label: 'Your name', autoComplete: 'name' },
    { key: 'email', label: 'Your email', type: 'email', autoComplete: 'email' },
    { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', placeholder: 'At least 8 characters' },
    { key: 'password_confirmation', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
];

export default function Signup() {
    const form = useForm({ school_name: '', address: '', phone: '', name: '', email: '', password: '', password_confirmation: '', website: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/signup', { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    const input = (field: Field, autoFocus = false) => (
        <div key={field.key}>
            <label htmlFor={field.key} className="mb-1.5 block text-sm font-medium">
                {field.label}
                {field.optional && <span className="font-normal text-zinc-400"> (optional)</span>}
            </label>
            <input
                id={field.key}
                type={field.type ?? 'text'}
                autoComplete={field.autoComplete}
                autoFocus={autoFocus}
                placeholder={field.placeholder}
                value={form.data[field.key]}
                onChange={(event) => form.setData(field.key, event.target.value)}
                className={inputClass}
            />
            <FieldError message={form.errors[field.key]} />
        </div>
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 font-sans text-zinc-900">
            <Head title="Create your school website" />
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-semibold text-white">SF</span>
                    <h1 className="mt-4 text-xl font-semibold">Create your school website</h1>
                    <p className="mt-1 text-sm text-zinc-500">Your site starts with pages and sample content ready to edit. Setup takes about five minutes.</p>
                </div>
                <form onSubmit={submit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <fieldset className="space-y-4">
                        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Your school</legend>
                        {schoolFields.map((field, index) => input(field, index === 0))}
                    </fieldset>
                    <fieldset className="space-y-4 border-t border-zinc-100 pt-6">
                        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Your login</legend>
                        {accountFields.map((field) => input(field))}
                    </fieldset>
                    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                        <label htmlFor="website">Leave this empty</label>
                        <input id="website" tabIndex={-1} autoComplete="off" value={form.data.website} onChange={(event) => form.setData('website', event.target.value)} />
                    </div>
                    <FieldError message={form.errors.website} />
                    <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                        {form.processing ? 'Creating your website…' : 'Create website'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-zinc-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
