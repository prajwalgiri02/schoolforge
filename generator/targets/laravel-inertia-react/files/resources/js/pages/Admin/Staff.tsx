import { router, useForm, usePage } from '@inertiajs/react';
import { ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';
import type { SharedProps } from '@/admin/types';
import { useAdminUrl } from '@/admin/urls';

type Member = { id: number; name: string; email: string; role: string; twoFactor: boolean };

type Role = { value: string; label: string; description: string };

export default function Staff({ staff, roles }: { staff: Member[]; roles: Role[] }) {
    const admin = useAdminUrl();
    const { auth, errors } = usePage<SharedProps & { errors: Record<string, string> }>().props;
    const form = useForm({ name: '', email: '', role: 'editor' });

    const invite = (event: FormEvent) => {
        event.preventDefault();
        form.post(admin('/staff'), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const remove = (member: Member) => {
        if (window.confirm(`Remove ${member.name}'s account?`)) {
            router.delete(admin(`/staff/${member.id}`), { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="Staff">
            {errors.user && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errors.user}</p>}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <ul className="h-fit divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    {staff.map((member) => (
                        <li key={member.id} className="flex flex-wrap items-center gap-3 p-4">
                            <div className="min-w-0 flex-1">
                                <p className="font-medium">
                                    {member.name} {member.id === auth.user?.id && <span className="text-xs font-normal text-zinc-500">(you)</span>}
                                </p>
                                <p className="flex items-center gap-2 truncate text-sm text-zinc-500">
                                    {member.email}
                                    {member.twoFactor && <ShieldCheck className="h-4 w-4 text-emerald-600" aria-label="Two-factor sign-in on" />}
                                </p>
                            </div>
                            <select aria-label={`Role of ${member.name}`} value={member.role} onChange={(event) => router.patch(admin(`/staff/${member.id}`), { role: event.target.value }, { preserveScroll: true })} className={`${inputClass} w-auto`}>
                                {roles.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                            {member.id !== auth.user?.id && (
                                <button type="button" onClick={() => remove(member)} aria-label={`Remove ${member.name}`} className={buttonClass.danger}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
                <form onSubmit={invite} className="h-fit space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="font-semibold">Invite staff</h2>
                    {(['name', 'email'] as const).map((field) => (
                        <div key={field}>
                            <label htmlFor={`staff-${field}`} className="mb-1.5 block text-sm font-medium capitalize">
                                {field}
                            </label>
                            <input id={`staff-${field}`} type={field === 'email' ? 'email' : 'text'} value={form.data[field]} onChange={(event) => form.setData(field, event.target.value)} className={inputClass} />
                            {form.errors[field] && <p className="mt-1.5 text-sm text-red-600">{form.errors[field]}</p>}
                        </div>
                    ))}
                    <fieldset className="space-y-2">
                        <legend className="mb-1.5 text-sm font-medium">Role</legend>
                        {roles.map((role) => (
                            <label key={role.value} className="flex gap-2 rounded-lg border border-zinc-200 p-2.5 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50">
                                <input type="radio" name="role" value={role.value} checked={form.data.role === role.value} onChange={() => form.setData('role', role.value)} className="mt-0.5" />
                                <span>
                                    <span className="font-medium">{role.label}</span>
                                    <span className="block text-xs text-zinc-500">{role.description}</span>
                                </span>
                            </label>
                        ))}
                    </fieldset>
                    <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                        <UserPlus className="h-4 w-4" /> Send invitation
                    </button>
                    <p className="text-xs text-zinc-500">They get an email with a link to choose their password.</p>
                </form>
            </div>
        </AdminLayout>
    );
}
