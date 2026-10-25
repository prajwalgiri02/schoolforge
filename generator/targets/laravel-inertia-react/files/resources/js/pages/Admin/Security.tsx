import { usePage } from '@inertiajs/react';
import { AccountSecurity, type AccountSecurityProps } from '@/admin/AccountSecurity';
import { AdminLayout } from '@/admin/AdminLayout';
import type { SharedProps } from '@/admin/types';
import { Avatar, Badge, Card } from '@/admin/ui';
import { useAdminUrl } from '@/admin/urls';

export default function Security(props: AccountSecurityProps) {
    const admin = useAdminUrl();
    const { auth } = usePage<SharedProps>().props;

    return (
        <AdminLayout title="Your account" description="Your sign-in details and how your account is protected.">
            <div className="space-y-6 lg:space-y-8">
                {auth.user && (
                    <Card title="Profile">
                        <div className="flex flex-wrap items-center gap-4">
                            <Avatar name={auth.user.name} size="lg" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xl font-medium text-[var(--admin-heading)]">{auth.user.name}</p>
                                <p className="truncate text-base text-[var(--admin-muted)]">{auth.user.email}</p>
                            </div>
                            <Badge tone={auth.user.isAdmin ? 'accent' : 'primary'}>{auth.user.isAdmin ? 'Administrator' : 'Editor'}</Badge>
                        </div>
                    </Card>
                )}
                <AccountSecurity baseUrl={admin('/account')} cardClass="rounded-[20px] border border-[var(--admin-border)] bg-white p-6" {...props} />
            </div>
        </AdminLayout>
    );
}
