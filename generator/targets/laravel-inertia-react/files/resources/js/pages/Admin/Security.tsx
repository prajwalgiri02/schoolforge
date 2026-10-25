import { AccountSecurity, type AccountSecurityProps } from '@/admin/AccountSecurity';
import { AdminLayout } from '@/admin/AdminLayout';
import { useAdminUrl } from '@/admin/urls';

export default function Security(props: AccountSecurityProps) {
    const admin = useAdminUrl();
    return (
        <AdminLayout title="Your account">
            <AccountSecurity baseUrl={admin('/account')} {...props} />
        </AdminLayout>
    );
}
