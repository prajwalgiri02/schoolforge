import { router, useForm, usePage } from '@inertiajs/react';
import { Trash2, UserPlus } from 'lucide-react';
import type { FormEvent } from 'react';
import { AdminLayout, buttonClass, inputClass } from '@/admin/AdminLayout';
import type { SharedProps } from '@/admin/types';
import { Avatar, Badge, Card, filterClass, table } from '@/admin/ui';
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
        <AdminLayout title="Staff" description="Who can sign in to this admin panel, and what they can change.">
            {errors.user && <p className="mb-4 rounded-[12px] border border-[#fbc7cf] bg-[#fde7eb] px-4 py-3 text-sm text-[#b00d24]">{errors.user}</p>}
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
                <Card title="All staff" padded={false}>
                    <div className={`${table.wrap} pb-3`}>
                        <table className={table.table}>
                            <thead className={table.head}>
                                <tr>
                                    <th className={table.th}>Name</th>
                                    <th className={table.th}>Role</th>
                                    <th className={table.th}>Two-factor</th>
                                    <th className={`${table.th} text-right`}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map((member) => (
                                    <tr key={member.id} className={table.row}>
                                        <td className={table.td}>
                                            <span className="flex items-center gap-3">
                                                <Avatar name={member.name} />
                                                <span className="min-w-0">
                                                    <span className="block text-[var(--admin-heading)]">
                                                        {member.name} {member.id === auth.user?.id && <span className="text-xs text-[var(--admin-muted)]">(you)</span>}
                                                    </span>
                                                    <span className="block truncate text-xs">{member.email}</span>
                                                </span>
                                            </span>
                                        </td>
                                        <td className={table.td}>
                                            <select aria-label={`Role of ${member.name}`} value={member.role} onChange={(event) => router.patch(admin(`/staff/${member.id}`), { role: event.target.value }, { preserveScroll: true })} className={filterClass}>
                                                {roles.map((role) => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className={table.td}>{member.twoFactor ? <Badge tone="green">On</Badge> : <Badge>Off</Badge>}</td>
                                        <td className={`${table.td} text-right`}>
                                            {member.id !== auth.user?.id && (
                                                <button type="button" onClick={() => remove(member)} aria-label={`Remove ${member.name}`} title={`Remove ${member.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-[#e11d38] transition hover:bg-[#fde7eb]">
                                                    <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Invite staff">
                    <form onSubmit={invite} className="space-y-4">
                        {(['name', 'email'] as const).map((field) => (
                            <div key={field}>
                                <label htmlFor={`staff-${field}`} className="mb-1.5 block text-sm capitalize text-[var(--admin-muted)]">
                                    {field}
                                </label>
                                <input id={`staff-${field}`} type={field === 'email' ? 'email' : 'text'} value={form.data[field]} onChange={(event) => form.setData(field, event.target.value)} className={inputClass} />
                                {form.errors[field] && <p className="mt-1.5 text-sm text-red-600">{form.errors[field]}</p>}
                            </div>
                        ))}
                        <fieldset className="space-y-2">
                            <legend className="mb-1.5 text-sm text-[var(--admin-muted)]">Role</legend>
                            {roles.map((role) => (
                                <label key={role.value} className="flex cursor-pointer gap-3 rounded-[12px] border border-[var(--admin-border)] p-3 text-sm transition has-[:checked]:border-[var(--admin-primary)] has-[:checked]:bg-[var(--admin-primary-soft)]">
                                    <input type="radio" name="role" value={role.value} checked={form.data.role === role.value} onChange={() => form.setData('role', role.value)} className="mt-0.5 accent-[var(--admin-primary)]" />
                                    <span>
                                        <span className="font-medium text-[var(--admin-heading)]">{role.label}</span>
                                        <span className="block text-xs text-[var(--admin-muted)]">{role.description}</span>
                                    </span>
                                </label>
                            ))}
                        </fieldset>
                        <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                            <UserPlus className="h-4 w-4" /> Send invitation
                        </button>
                        <p className="text-xs text-[var(--admin-muted)]">They get an email with a link to choose their password.</p>
                    </form>
                </Card>
            </div>
        </AdminLayout>
    );
}
