import { AccountSecurity, type AccountSecurityProps } from '@admin/AccountSecurity';
import { PageHeading, StudioLayout } from '@/studio/StudioLayout';

export default function AccountIndex(props: AccountSecurityProps) {
    return (
        <StudioLayout title="Your account">
            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                <PageHeading title="Your account" description="Your password and two-factor sign-in." />
                <AccountSecurity baseUrl="/account" {...props} />
            </main>
        </StudioLayout>
    );
}
