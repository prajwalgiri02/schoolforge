import { NextResponse } from 'next/server';
import { defaultLocale, sites } from '@/school/sites';

export const dynamic = 'force-dynamic';

/**
 * For uptime monitors and SchoolForge Studio's status page. A Next.js site is
 * static, so if this answers the site is up; it also reports whether the
 * optional form webhooks are configured.
 */
export function GET() {
    const site = sites[defaultLocale];

    return NextResponse.json({
        status: 'ok',
        checkedAt: new Date().toISOString(),
        checks: [
            { name: 'site', status: 'ok', message: `${site.pages.length} pages are being served.` },
            {
                name: 'forms',
                status: process.env.FORMS_WEBHOOK_URL && process.env.CONTACT_WEBHOOK_URL ? 'ok' : 'warning',
                message: process.env.FORMS_WEBHOOK_URL && process.env.CONTACT_WEBHOOK_URL ? 'Form webhooks are set.' : 'Set CONTACT_WEBHOOK_URL and FORMS_WEBHOOK_URL so enquiries and applications reach the school.',
            },
        ],
    });
}
