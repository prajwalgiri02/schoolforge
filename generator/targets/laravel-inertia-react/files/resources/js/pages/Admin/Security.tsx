import { AccountSecurity, type AccountSecurityProps } from '@/admin/AccountSecurity';
import { AdminLayout } from '@/admin/AdminLayout';

export default function Security(props: AccountSecurityProps) {
    return (
        <AdminLayout title="Your account">
            <AccountSecurity baseUrl="/admin/account" {...props} />
        </AdminLayout>
    );
}
