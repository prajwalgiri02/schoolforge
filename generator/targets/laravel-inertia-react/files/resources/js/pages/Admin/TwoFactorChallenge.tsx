import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { AuthCard } from '@/admin/AuthCard';
import { TwoFactorCodeForm } from '@/admin/TwoFactorCodeForm';

export default function TwoFactorChallenge({ schoolName }: { schoolName: string }) {
    const [recovery, setRecovery] = useState(false);

    return (
        <AuthCard schoolName={schoolName} title="Two-factor sign-in" subtitle={recovery ? 'Enter one of your recovery codes' : 'Enter the 6-digit code from your authenticator app'} footer={<Link href="/admin/login">Back to sign in</Link>}>
            <TwoFactorCodeForm action="/admin/two-factor" onModeChange={setRecovery} />
        </AuthCard>
    );
}
