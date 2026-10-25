import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ScrollText, Trash2, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { buttonClass, inputClass } from '@admin/AdminLayout';
import { FieldError, PageHeading, StudioLayout } from '@/studio/StudioLayout';
import type { StudioSharedProps } from '@/studio/types';

type User = { id: number; name: string; email: string; role: string; project_id: number | null; project: { id: number; name: string; slug: string } | null };

type School = { id: number; name: string };

type Role = { value: string; label: string; description: string };

/**
 * A user's role; school staff also choose the school they look after before the change is saved.
 */
function RoleControl({ user, roles, schools }: { user: User; roles: Role[]; schools: School[] }) {
    const [role, setRole] = useState(user.role);
    const save = (nextRole: string, projectId: number | null) => router.patch(`/users/${user.id}`, { role: nextRole, project_id: projectId }, { preserveScroll: true });

    return (
        <div className="flex flex-wrap gap-2">
            <select
                aria-label={`Role of ${user.name}`}
                value={role}
                onChange={(event) => {
                    setRole(event.target.value);

                    if (event.target.value !== 'school') {
                        save(event.target.value, null);
                    }
                }}
                className={`${inputClass} w-auto`}
            >
                {roles.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
            {role === 'school' && (
                <select aria-label={`School of ${user.name}`} value={user.role === 'school' ? (user.project_id ?? '') : ''} onChange={(event) => event.target.value && save('school', Number(event.target.value))} className={`${inputClass} w-auto max-w-48`}>
                    <option value="">Choose a school…</option>
                    {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                            {school.name}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}

export default function UsersIndex({ users, roles, schools }: { users: User[]; roles: Role[]; schools: School[] }) {
    const { auth, errors } = usePage<StudioSharedProps>().props;
    const form = useForm({ name: '', email: '', role: 'editor', password: '', project_id: '' as number | '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/users', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const remove = (user: User) => {
        if (window.confirm(`Remove ${user.name}'s login?`)) {
            router.delete(`/users/${user.id}`, { preserveScroll: true });
        }
    };

    return (
        <StudioLayout title="Users">
            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                <PageHeading
                    title="Users"
                    description="Who can sign in to Studio and what they may do."
                    actions={
                        <Link href="/activity" className={buttonClass.secondary}>
                            <ScrollText className="h-4 w-4" /> Activity log
                        </Link>
                    }
                />
                <FieldError message={errors.user} />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <ul className="h-fit divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        {users.map((user) => (
                            <li key={user.id} className="flex flex-wrap items-center gap-3 p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium">
                                        {user.name} {user.id === auth.user?.id && <span className="text-xs font-normal text-zinc-500">(you)</span>}
                                    </p>
                                    <p className="truncate text-sm text-zinc-500">
                                        {user.email}
                                        {user.project && ` · ${user.project.name}`}
                                    </p>
                                </div>
                                <RoleControl key={`${user.role}-${user.project_id}`} user={user} roles={roles} schools={schools} />
                                {user.id !== auth.user?.id && (
                                    <button type="button" onClick={() => remove(user)} aria-label={`Remove ${user.name}`} className={buttonClass.danger}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                    <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <h2 className="font-semibold">Add a user</h2>
                        {(['name', 'email', 'password'] as const).map((field) => (
                            <div key={field}>
                                <label htmlFor={`user-${field}`} className="mb-1.5 block text-sm font-medium capitalize">
                                    {field}
                                </label>
                                <input id={`user-${field}`} type={field === 'name' ? 'text' : field} value={form.data[field]} onChange={(event) => form.setData(field, event.target.value)} autoComplete={field === 'password' ? 'new-password' : 'off'} className={inputClass} />
                                <FieldError message={form.errors[field]} />
                            </div>
                        ))}
                        <fieldset className="space-y-2">
                            <legend className="mb-1.5 text-sm font-medium">Role</legend>
                            {roles.map((role) => (
                                <label key={role.value} className="flex gap-2 rounded-lg border border-zinc-200 p-2.5 text-sm has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
                                    <input type="radio" name="role" value={role.value} checked={form.data.role === role.value} onChange={() => form.setData('role', role.value)} className="mt-0.5" />
                                    <span>
                                        <span className="font-medium">{role.label}</span>
                                        <span className="block text-xs text-zinc-500">{role.description}</span>
                                    </span>
                                </label>
                            ))}
                        </fieldset>
                        {form.data.role === 'school' && (
                            <div>
                                <label htmlFor="user-school" className="mb-1.5 block text-sm font-medium">
                                    School
                                </label>
                                <select id="user-school" value={form.data.project_id} onChange={(event) => form.setData('project_id', event.target.value ? Number(event.target.value) : '')} className={inputClass}>
                                    <option value="">Choose a school…</option>
                                    {schools.map((school) => (
                                        <option key={school.id} value={school.id}>
                                            {school.name}
                                        </option>
                                    ))}
                                </select>
                                <FieldError message={form.errors.project_id} />
                            </div>
                        )}
                        <button type="submit" disabled={form.processing} className={`${buttonClass.primary} w-full`}>
                            <UserPlus className="h-4 w-4" /> Add user
                        </button>
                    </form>
                </div>
            </main>
        </StudioLayout>
    );
}
